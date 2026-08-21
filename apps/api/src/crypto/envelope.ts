import crypto from "node:crypto";
import { SecretCryptoError } from "./errors.js";
import { kms } from "./kms.js";

export interface EncryptedSecret {
  version: 1;
  keyVersion: string;
  algorithm: "AES-256-GCM";
  ciphertext: string;
  iv: string;
  authTag: string;
  wrappedDataKey: string;
}

const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const ALGORITHM = "AES-256-GCM" as const;

function fail(code: ConstructorParameters<typeof SecretCryptoError>[0]): never {
  throw new SecretCryptoError(code);
}

function decodeBase64Url(value: unknown, allowEmpty = false): Buffer {
  if (
    typeof value !== "string" ||
    (!allowEmpty && value.length === 0) ||
    !/^[A-Za-z0-9_-]*$/.test(value)
  ) {
    return fail("INVALID_PAYLOAD");
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    decoded.fill(0);
    return fail("INVALID_PAYLOAD");
  }
  return decoded;
}

function validateEncryptedSecret(payload: unknown): EncryptedSecret {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fail("INVALID_PAYLOAD");
  }

  const value = payload as Record<string, unknown>;
  if (value.version !== 1) return fail("UNSUPPORTED_ALGORITHM");
  if (value.algorithm !== ALGORITHM) return fail("UNSUPPORTED_ALGORITHM");
  if (typeof value.keyVersion !== "string" || !/^[A-Za-z0-9._-]{1,64}$/.test(value.keyVersion)) {
    return fail("INVALID_PAYLOAD");
  }

  const iv = decodeBase64Url(value.iv);
  const authTag = decodeBase64Url(value.authTag);
  const ciphertext = decodeBase64Url(value.ciphertext, true);
  const wrappedDataKey = decodeBase64Url(value.wrappedDataKey);
  try {
    if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES || wrappedDataKey.length === 0) {
      return fail("INVALID_PAYLOAD");
    }
  } finally {
    iv.fill(0);
    authTag.fill(0);
    ciphertext.fill(0);
    wrappedDataKey.fill(0);
  }

  return value as unknown as EncryptedSecret;
}

/**
 * Envelope encryption: generate a fresh 256-bit data key per secret,
 * encrypt the secret value with it (AES-256-GCM), then wrap the data
 * key itself with the KMS master key. Only the wrapped data key and
 * the ciphertext are stored — the raw data key never touches disk.
 *
 * Why per-secret keys instead of one key for everything: a single
 * compromised data key only exposes one secret, not the whole vault,
 * and rotation can happen per-secret without re-touching the master key.
 */
export async function encryptSecret(
  plaintext: string,
  keyVersion = kms.activeKeyVersion
): Promise<EncryptedSecret> {
  if (typeof plaintext !== "string") return fail("ENCRYPTION_FAILED");
  const dataKey = crypto.randomBytes(32);
  const plaintextBytes = Buffer.from(plaintext, "utf8");
  try {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintextBytes), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const wrappedDataKey = await kms.wrap(dataKey, keyVersion);

    return {
      version: 1,
      keyVersion,
      algorithm: ALGORITHM,
      ciphertext: ciphertext.toString("base64url"),
      iv: iv.toString("base64url"),
      authTag: authTag.toString("base64url"),
      wrappedDataKey,
    };
  } catch (error) {
    if (error instanceof SecretCryptoError) throw error;
    return fail("ENCRYPTION_FAILED");
  } finally {
    dataKey.fill(0);
    plaintextBytes.fill(0);
  }
}

export async function decryptSecret(enc: EncryptedSecret): Promise<string> {
  const payload = validateEncryptedSecret(enc);
  let dataKey: Buffer | undefined;
  let iv: Buffer | undefined;
  let authTag: Buffer | undefined;
  let ciphertext: Buffer | undefined;
  let plaintext: Buffer | undefined;
  try {
    dataKey = await kms.unwrap(payload.wrappedDataKey, payload.keyVersion);
    iv = decodeBase64Url(payload.iv);
    authTag = decodeBase64Url(payload.authTag);
    ciphertext = decodeBase64Url(payload.ciphertext, true);
    const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);
    decipher.setAuthTag(authTag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch (error) {
    if (error instanceof SecretCryptoError) throw error;
    return fail("DECRYPTION_FAILED");
  } finally {
    dataKey?.fill(0);
    iv?.fill(0);
    authTag?.fill(0);
    ciphertext?.fill(0);
    plaintext?.fill(0);
  }
}

export async function rotateSecret(
  payload: EncryptedSecret,
  newKeyVersion: string
): Promise<EncryptedSecret> {
  const plaintext = await decryptSecret(payload);
  return encryptSecret(plaintext, newKeyVersion);
}
