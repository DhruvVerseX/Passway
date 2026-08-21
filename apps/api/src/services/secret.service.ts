import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { encryptSecret } from "../crypto/envelope.js";
import { secret } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { getOwnedEnvironment } from "./environment-access.js";

const MAX_SECRET_BYTES = 64 * 1024;

const writeSchema = z.object({
  key: z.string().regex(/^[A-Z][A-Z0-9_]{0,127}$/),
  value: z.string().max(MAX_SECRET_BYTES),
  description: z.string().max(1_024).optional(),
  tags: z.array(z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/)).max(20).optional(),
});

export type SecretWriteInput = z.infer<typeof writeSchema>;

export class SecretInputError extends Error {
  constructor() {
    super("Invalid secret input");
    this.name = "SecretInputError";
  }
}

export class SecretAccessError extends Error {
  constructor(readonly code: "NOT_FOUND" | "LOCKED") {
    super("Secret operation failed");
    this.name = "SecretAccessError";
  }
}

function metadata(record: typeof secret.$inferSelect) {
  return {
    id: record.id,
    environmentId: record.environmentId,
    key: record.key,
    description: record.description,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function requireDraftEnvironment(environmentId: string, userId: string) {
  const owned = await getOwnedEnvironment(environmentId, userId);
  if (!owned) throw new SecretAccessError("NOT_FOUND");
  if (owned.status !== "draft") throw new SecretAccessError("LOCKED");
  return owned;
}

export class SecretService {
  parseWriteInput(input: unknown): SecretWriteInput {
    const parsed = writeSchema.safeParse(input);
    if (!parsed.success || Buffer.byteLength(parsed.data.value, "utf8") > MAX_SECRET_BYTES) {
      throw new SecretInputError();
    }
    return parsed.data;
  }

  async list(environmentId: string, userId: string) {
    const owned = await getOwnedEnvironment(environmentId, userId);
    if (!owned) throw new SecretAccessError("NOT_FOUND");
    const records = await db.select().from(secret).where(eq(secret.environmentId, environmentId));
    return { environment: owned, secrets: records.map(metadata) };
  }

  async createOrUpdate(environmentId: string, userId: string, input: SecretWriteInput) {
    const owned = await requireDraftEnvironment(environmentId, userId);
    const encrypted = await encryptSecret(input.value);
    const now = new Date();
    const [existing] = await db
      .select()
      .from(secret)
      .where(and(eq(secret.environmentId, environmentId), eq(secret.key, input.key)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(secret)
        .set({ ...encrypted, description: input.description, tags: input.tags, updatedAt: now })
        .where(eq(secret.id, existing.id))
        .returning();
      return { environment: owned, secret: metadata(updated), action: "SECRET_UPDATED" as const };
    }

    const [created] = await db
      .insert(secret)
      .values({
        id: crypto.randomUUID(),
        environmentId,
        key: input.key,
        description: input.description,
        tags: input.tags,
        payloadVersion: encrypted.version,
        keyVersion: encrypted.keyVersion,
        algorithm: encrypted.algorithm,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        wrappedDataKey: encrypted.wrappedDataKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return { environment: owned, secret: metadata(created), action: "SECRET_CREATED" as const };
  }

  async delete(environmentId: string, userId: string, key: string) {
    const owned = await requireDraftEnvironment(environmentId, userId);
    const [deleted] = await db
      .delete(secret)
      .where(and(eq(secret.environmentId, environmentId), eq(secret.key, key)))
      .returning();
    return { environment: owned, secret: deleted ? metadata(deleted) : undefined };
  }
}

export const secretService = new SecretService();
