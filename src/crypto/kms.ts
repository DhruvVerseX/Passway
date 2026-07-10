import crypto from "node:crypto";

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
  /** Wraps (encrypts) a raw data-encryption key. Returns base64. */
  wrap(dataKey: Buffer): Promise<string>;
  /** Unwraps (decrypts) a previously wrapped data-encryption key. */
  unwrap(wrappedKey: string): Promise<Buffer>;
}

const MASTER_KEY_ENV = "PASSWAY_MASTER_KEY";

function loadMasterKey(): Buffer {
  const fromEnv = process.env[MASTER_KEY_ENV];
  if (fromEnv) {
    const key = Buffer.from(fromEnv, "base64");
    if (key.length !== 32) {
      throw new Error(
        `${MASTER_KEY_ENV} must decode to exactly 32 bytes (256 bits)`
      );
    }
    return key;
  }
  // Dev-only fallback so the service boots without setup. Never do this
  // in production — a restart would make every stored secret unrecoverable
  // if this were the only place the key lived, and worse, a fixed key
  // baked into source would be a real vulnerability. Always inject
  // PASSWAY_MASTER_KEY from a real KMS/secrets manager in prod.
  console.warn(
    `[kms] ${MASTER_KEY_ENV} not set — generating an ephemeral dev-only master key. ` +
      `Secrets will NOT survive a restart. Set ${MASTER_KEY_ENV} for anything real.`
  );
  return crypto.randomBytes(32);
}

/**
 * Local stand-in for a KMS. Wraps data keys with AES-256-GCM using a
 * single master key. This is a legitimate pattern for a real KMS's
 * internals too — the difference is a real KMS keeps the master key in
 * hardware/HSM and never lets it leave, whereas here it's just an env var.
 */
export class LocalKms implements Kms {
  private masterKey = loadMasterKey();

  async wrap(dataKey: Buffer): Promise<string> {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Pack iv | authTag | ciphertext into one base64 blob for storage.
    return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
  }

  async unwrap(wrappedKey: string): Promise<Buffer> {
    const raw = Buffer.from(wrappedKey, "base64");
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}

export const kms: Kms = new LocalKms();
