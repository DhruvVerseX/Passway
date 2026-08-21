import { Buffer } from "node:buffer";
import { z } from "zod";
import { encryptSecret, decryptSecret, rotateSecret } from "../crypto/envelope.js";
import { newId, store, type SecretRecord } from "../store/db.js";

const MAX_SECRET_BYTES = 64 * 1024;

const scopeSchema = z.object({
  project: z.string().min(1).max(128),
  environment: z.enum(["development", "staging", "production"]),
});

const writeSchema = scopeSchema.extend({
  key: z.string().regex(/^[A-Z][A-Z0-9_]{0,127}$/),
  value: z.string().max(MAX_SECRET_BYTES),
  description: z.string().max(1_024).optional(),
  tags: z.array(z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/)).max(20).optional(),
});

export type SecretScope = z.infer<typeof scopeSchema>;
export type SecretWriteInput = z.infer<typeof writeSchema>;

export class SecretInputError extends Error {
  constructor() {
    super("Invalid secret input");
    this.name = "SecretInputError";
  }
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new SecretInputError();
  return parsed.data;
}

function metadata(record: SecretRecord) {
  return {
    id: record.id,
    key: record.key,
    project: record.project,
    environment: record.environment,
    description: record.description,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class SecretService {
  parseScope(input: unknown): SecretScope {
    return parse(scopeSchema, input);
  }

  parseWriteInput(input: unknown): SecretWriteInput {
    const value = parse(writeSchema, input);
    if (Buffer.byteLength(value.value, "utf8") > MAX_SECRET_BYTES) throw new SecretInputError();
    return value;
  }

  getMetadata(scope: SecretScope & { key: string }) {
    const record = store.getSecret(scope.project, scope.environment, scope.key);
    return record ? metadata(record) : undefined;
  }

  list(scope: SecretScope) {
    return store.listSecrets(scope.project, scope.environment).map(metadata);
  }

  async create(input: SecretWriteInput) {
    if (this.getMetadata(input)) throw new SecretInputError();
    return this.write(input, newId(), new Date().toISOString());
  }

  async update(input: SecretWriteInput) {
    const existing = store.getSecret(input.project, input.environment, input.key);
    if (!existing) return undefined;
    return this.write(input, existing.id, existing.createdAt);
  }

  async getValue(scope: SecretScope & { key: string }) {
    const record = store.getSecret(scope.project, scope.environment, scope.key);
    if (!record) return undefined;
    return { metadata: metadata(record), value: await decryptSecret(record) };
  }

  delete(scope: SecretScope & { key: string }) {
    const existing = this.getMetadata(scope);
    if (!existing) return undefined;
    store.deleteSecret(scope.project, scope.environment, scope.key);
    return existing;
  }

  async rotate(scope: SecretScope & { key: string }, newKeyVersion: string) {
    const existing = store.getSecret(scope.project, scope.environment, scope.key);
    if (!existing) return undefined;

    const encrypted = await rotateSecret(existing, newKeyVersion);
    const updatedAt = new Date().toISOString();
    store.putSecret({ ...existing, ...encrypted, updatedAt });
    return metadata({ ...existing, ...encrypted, updatedAt });
  }

  private async write(input: SecretWriteInput, id: string, createdAt: string) {
    const encrypted = await encryptSecret(input.value);
    const updatedAt = new Date().toISOString();
    const record: SecretRecord = {
      id,
      project: input.project,
      environment: input.environment,
      key: input.key,
      description: input.description,
      tags: input.tags,
      createdAt,
      updatedAt,
      ...encrypted,
    };
    store.putSecret(record);
    return metadata(record);
  }
}

export const secretService = new SecretService();
