import crypto from "node:crypto";
import { kms } from "./kms.js";

export interface EncryptedSecret {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  wrappedDataKey: string; // base64, produced by kms.wrap()
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
export async function encryptSecret(plaintext: string): Promise<EncryptedSecret> {
  const dataKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const wrappedDataKey = await kms.wrap(dataKey);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    wrappedDataKey,
  };
}

export async function decryptSecret(enc: EncryptedSecret): Promise<string> {
  const dataKey = await kms.unwrap(enc.wrappedDataKey);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    dataKey,
    Buffer.from(enc.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(enc.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(enc.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
