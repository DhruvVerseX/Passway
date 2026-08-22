import { Buffer } from "node:buffer";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { encryptSecret } from "../crypto/envelope.js";
import { auditLog, secret } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import {
  MAX_SECRET_KEY_LENGTH,
  MAX_SECRET_VALUE_BYTES,
  parseEnvContent,
  ParsedSecret,
} from "./env-import.js";
import { getOwnedEnvironment } from "./environment-access.js";

const keyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

const writeSchema = z.object({
  key: z.string().min(1).max(MAX_SECRET_KEY_LENGTH).regex(keyPattern),
  value: z.string(),
  description: z.string().max(1_024).optional(),
  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(64)
        .regex(/^[A-Za-z0-9._-]+$/),
    )
    .max(20)
    .optional(),
});

export type SecretWriteInput = z.infer<typeof writeSchema>;

export class SecretInputError extends Error {
  constructor() {
    super("Invalid secret input");
    this.name = "SecretInputError";
  }
}

export class SecretConflictError extends Error {
  constructor(readonly keys: string[]) {
    super("One or more secret keys already exist");
    this.name = "SecretConflictError";
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

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
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
    if (!parsed.success) throw new SecretInputError();
    if (Buffer.byteLength(parsed.data.value, "utf8") > MAX_SECRET_VALUE_BYTES) {
      throw new SecretInputError();
    }
    return parsed.data;
  }

  parseImport(input: string): ParsedSecret[] {
    try {
      return parseEnvContent(input);
    } catch {
      throw new SecretInputError();
    }
  }

  async list(environmentId: string, userId: string) {
    const owned = await getOwnedEnvironment(environmentId, userId);
    if (!owned) throw new SecretAccessError("NOT_FOUND");
    const records = await db
      .select()
      .from(secret)
      .where(eq(secret.environmentId, environmentId));
    return { environment: owned, secrets: records.map(metadata) };
  }

  async createOrUpdate(
    environmentId: string,
    userId: string,
    input: SecretWriteInput,
  ) {
    const owned = await requireDraftEnvironment(environmentId, userId);
    const [existing] = await db
      .select()
      .from(secret)
      .where(
        and(eq(secret.environmentId, environmentId), eq(secret.key, input.key)),
      )
      .limit(1);

    if (existing) throw new SecretConflictError([input.key]);

    const encrypted = await encryptSecret(input.value);
    const now = new Date();
    try {
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
      return {
        environment: owned,
        secret: metadata(created),
        action: "SECRET_CREATED" as const,
      };
    } catch (error) {
      if (isUniqueViolation(error)) throw new SecretConflictError([input.key]);
      throw error;
    }
  }

  async importMany(
    environmentId: string,
    userId: string,
    input: ParsedSecret[],
    ip: string,
  ) {
    const owned = await requireDraftEnvironment(environmentId, userId);
    if (!input.length) return { environment: owned, secrets: [] };

    const encrypted = await Promise.all(
      input.map(async (item) => ({
        item,
        payload: await encryptSecret(item.value),
      })),
    );
    const now = new Date();

    try {
      const result = await db.transaction(async (tx) => {
        const existing = await tx
          .select({ key: secret.key })
          .from(secret)
          .where(eq(secret.environmentId, environmentId));
        const existingKeys = new Set(existing.map((item) => item.key));
        const conflicts = input
          .map((item) => item.key)
          .filter((key) => existingKeys.has(key));
        if (conflicts.length) throw new SecretConflictError(conflicts);

        const records = await tx
          .insert(secret)
          .values(
            encrypted.map(({ item, payload }) => ({
              id: crypto.randomUUID(),
              environmentId,
              key: item.key,
              payloadVersion: payload.version,
              keyVersion: payload.keyVersion,
              algorithm: payload.algorithm,
              ciphertext: payload.ciphertext,
              iv: payload.iv,
              authTag: payload.authTag,
              wrappedDataKey: payload.wrappedDataKey,
              createdAt: now,
              updatedAt: now,
            })),
          )
          .returning();

        await tx.insert(auditLog).values(
          auditValues({
            environmentId,
            projectId: owned.projectId,
            workspaceId: owned.workspaceId,
            actorUserId: userId,
            ip,
            action: "SECRETS_IMPORTED",
            reason: `${records.length} secret(s) imported`,
          }),
        );

        return records.map(metadata);
      });

      return { environment: owned, secrets: result };
    } catch (error) {
      if (error instanceof SecretConflictError) throw error;
      if (isUniqueViolation(error)) {
        throw new SecretConflictError(input.map((item) => item.key));
      }
      throw error;
    }
  }

  async delete(environmentId: string, userId: string, key: string) {
    const owned = await requireDraftEnvironment(environmentId, userId);
    const [deleted] = await db
      .delete(secret)
      .where(and(eq(secret.environmentId, environmentId), eq(secret.key, key)))
      .returning();
    return {
      environment: owned,
      secret: deleted ? metadata(deleted) : undefined,
    };
  }
}

export const secretService = new SecretService();
