import { Buffer } from "node:buffer";
import { z } from "zod";

export const MAX_IMPORT_BYTES = 512 * 1024;
export const MAX_IMPORT_SECRETS = 100;
export const MAX_SECRET_KEY_LENGTH = 128;
export const MAX_SECRET_VALUE_BYTES = 64 * 1024;

const keyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

const parsedSecretSchema = z.object({
  key: z.string().min(1).max(MAX_SECRET_KEY_LENGTH).regex(keyPattern),
  value: z.string(),
});

export type ParsedSecret = z.infer<typeof parsedSecretSchema>;

export class EnvImportError extends Error {
  constructor(
    readonly code:
      | "PAYLOAD_TOO_LARGE"
      | "TOO_MANY_SECRETS"
      | "INVALID_LINE"
      | "INVALID_KEY"
      | "VALUE_TOO_LARGE"
      | "DUPLICATE_KEY",
    readonly key?: string,
  ) {
    super("Invalid environment import");
    this.name = "EnvImportError";
  }
}

function unquote(value: string) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

export function parseEnvContent(content: string): ParsedSecret[] {
  if (Buffer.byteLength(content, "utf8") > MAX_IMPORT_BYTES) {
    throw new EnvImportError("PAYLOAD_TOO_LARGE");
  }

  const parsed: ParsedSecret[] = [];
  const seen = new Set<string>();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([^=\s]+)\s*=\s?(.*)$/);
    if (!match) throw new EnvImportError("INVALID_LINE");

    const key = match[1];
    if (!keyPattern.test(key) || key.length > MAX_SECRET_KEY_LENGTH) {
      throw new EnvImportError("INVALID_KEY", key);
    }
    if (seen.has(key)) throw new EnvImportError("DUPLICATE_KEY", key);

    const value = unquote(match[2].trim());
    if (Buffer.byteLength(value, "utf8") > MAX_SECRET_VALUE_BYTES) {
      throw new EnvImportError("VALUE_TOO_LARGE", key);
    }

    const result = parsedSecretSchema.safeParse({ key, value });
    if (!result.success) throw new EnvImportError("INVALID_KEY", key);
    parsed.push(result.data);
    seen.add(key);

    if (parsed.length > MAX_IMPORT_SECRETS) {
      throw new EnvImportError("TOO_MANY_SECRETS");
    }
  }

  return parsed;
}
