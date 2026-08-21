import crypto from "node:crypto";
import { SecretCryptoError } from "./errors.js";

/**
 * Minimal KMS contract. In production this wraps a real key management
 * service (AWS KMS, GCP KMS, Vault's transit engine) so the master key
 * never lives in your application process. For local development we
 * simulate it with a key pulled from the environment.
 *
 * The app never handles the master key directly — only wrap()/unwrap().
 * That's the property that matters: swapping LocalKms for a real KMS
 * client later requires no changes anywhere else in the codebase.
 */
export interface Kms {
  readonly activeKeyVersion: string;
  /** Wraps a raw data-encryption key using the named master-key version. */
  wrap(dataKey: Buffer, keyVersion: string): Promise<string>;
  /** Unwraps a data-encryption key with the master-key version that created it. */
  unwrap(wrappedKey: string, keyVersion: string): Promise<Buffer>;
}

const ACTIVE_KEY_VERSION_ENV = "PASSWAY_ACTIVE_KEY_VERSION";
const MASTER_KEYS_ENV = "PASSWAY_MASTER_KEYS";
const LEGACY_MASTER_KEY_ENV = "PASSWAY_MASTER_KEY";
const KEY_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const WRAPPED_KEY_BYTES = 12 + 16 + 32;

interface Keyring {
  activeKeyVersion: string;
  keys: Map<string, Buffer>;
}

function fail(code: ConstructorParameters<typeof SecretCryptoError>[0]): never {
  throw new SecretCryptoError(code);
}

function decodeKey(value: string): Buffer {
  const isHex = /^[0-9a-f]{64}$/i.test(value);
  const isBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
  if (!isHex && !isBase64) return fail("KEY_UNAVAILABLE");

  const key = Buffer.from(value, isHex ? "hex" : "base64");
  if (key.length !== 32) {
    key.fill(0);
    return fail("KEY_UNAVAILABLE");
  }
  return key;
}

function loadKeyring(): Keyring {
  const activeKeyVersion = process.env[ACTIVE_KEY_VERSION_ENV] ?? "v1";
  if (!KEY_VERSION_PATTERN.test(activeKeyVersion)) return fail("KEY_UNAVAILABLE");

  const configured = process.env[MASTER_KEYS_ENV];
  let rawKeys: Record<string, string>;
  if (configured) {
    try {
      const parsed: unknown = JSON.parse(configured);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return fail("KEY_UNAVAILABLE");
      }
      rawKeys = {};
      for (const [version, key] of Object.entries(parsed)) {
        if (!KEY_VERSION_PATTERN.test(version) || typeof key !== "string") {
          return fail("KEY_UNAVAILABLE");
        }
        rawKeys[version] = key;
      }
    } catch {
      return fail("KEY_UNAVAILABLE");
    }
  } else {
    const legacyKey = process.env[LEGACY_MASTER_KEY_ENV];
    if (!legacyKey) return fail("KEY_UNAVAILABLE");
    rawKeys = { [activeKeyVersion]: legacyKey };
  }

  const keys = new Map<string, Buffer>();
  try {
    for (const [version, key] of Object.entries(rawKeys)) {
      if (!KEY_VERSION_PATTERN.test(version)) return fail("KEY_UNAVAILABLE");
      keys.set(version, decodeKey(key));
    }
    if (!keys.has(activeKeyVersion)) return fail("KEY_UNAVAILABLE");
    return { activeKeyVersion, keys };
  } catch (error) {
    for (const key of keys.values()) key.fill(0);
    throw error;
  }
}

function decodeBase64Url(value: string, expectedLength?: number): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return fail("INVALID_PAYLOAD");
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value || (expectedLength && decoded.length !== expectedLength)) {
    decoded.fill(0);
    return fail("INVALID_PAYLOAD");
  }
  return decoded;
}

/**
 * Local stand-in for a KMS. Wraps data keys with AES-256-GCM using a
 * single master key. This is a legitimate pattern for a real KMS's
 * internals too — the difference is a real KMS keeps the master key in
 * hardware/HSM and never lets it leave, whereas here it's just an env var.
 */
export class LocalKms implements Kms {
  get activeKeyVersion(): string {
    const keyring = loadKeyring();
    try {
      return keyring.activeKeyVersion;
    } finally {
      for (const key of keyring.keys.values()) key.fill(0);
    }
  }

  async wrap(dataKey: Buffer, keyVersion: string): Promise<string> {
    if (dataKey.length !== 32 || !KEY_VERSION_PATTERN.test(keyVersion)) {
      return fail("ENCRYPTION_FAILED");
    }

    const keyring = loadKeyring();
    const masterKey = keyring.keys.get(keyVersion);
    if (!masterKey) {
      for (const key of keyring.keys.values()) key.fill(0);
      return fail("KEY_UNAVAILABLE");
    }

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
      const ciphertext = Buffer.concat([cipher.update(dataKey), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
    } catch {
      return fail("ENCRYPTION_FAILED");
    } finally {
      for (const key of keyring.keys.values()) key.fill(0);
    }
  }

  async unwrap(wrappedKey: string, keyVersion: string): Promise<Buffer> {
    if (!KEY_VERSION_PATTERN.test(keyVersion)) return fail("KEY_UNAVAILABLE");

    const keyring = loadKeyring();
    const masterKey = keyring.keys.get(keyVersion);
    if (!masterKey) {
      for (const key of keyring.keys.values()) key.fill(0);
      return fail("KEY_UNAVAILABLE");
    }

    let raw: Buffer | undefined;
    try {
      raw = decodeBase64Url(wrappedKey, WRAPPED_KEY_BYTES);
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        masterKey,
        raw.subarray(0, 12)
      );
      decipher.setAuthTag(raw.subarray(12, 28));
      const dataKey = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
      if (dataKey.length !== 32) {
        dataKey.fill(0);
        return fail("DECRYPTION_FAILED");
      }
      return dataKey;
    } catch (error) {
      if (error instanceof SecretCryptoError) throw error;
      return fail("DECRYPTION_FAILED");
    } finally {
      raw?.fill(0);
      for (const key of keyring.keys.values()) key.fill(0);
    }
  }
}

export const kms: Kms = new LocalKms();
