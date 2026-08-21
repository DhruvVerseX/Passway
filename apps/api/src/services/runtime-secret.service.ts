import { eq } from "drizzle-orm";
import { decryptSecret, type EncryptedSecret } from "../crypto/envelope.js";
import { secret } from "../db/auth-schema.js";
import { db } from "../db/index.js";

type EncryptedRecord = {
  key: string;
  payloadVersion: number;
  keyVersion: string;
  algorithm: string;
  ciphertext: string;
  iv: string;
  authTag: string;
  wrappedDataKey: string;
};

async function encryptedRecords(environmentId: string): Promise<EncryptedRecord[]> {
  return db
    .select({
      key: secret.key,
      payloadVersion: secret.payloadVersion,
      keyVersion: secret.keyVersion,
      algorithm: secret.algorithm,
      ciphertext: secret.ciphertext,
      iv: secret.iv,
      authTag: secret.authTag,
      wrappedDataKey: secret.wrappedDataKey,
    })
    .from(secret)
    .where(eq(secret.environmentId, environmentId));
}

function payload(record: EncryptedRecord): EncryptedSecret {
  return {
    version: record.payloadVersion as 1,
    keyVersion: record.keyVersion,
    algorithm: record.algorithm as "AES-256-GCM",
    ciphertext: record.ciphertext,
    iv: record.iv,
    authTag: record.authTag,
    wrappedDataKey: record.wrappedDataKey,
  };
}

export async function getRuntimeSecretBundle(environmentId: string) {
  const records = await encryptedRecords(environmentId);
  const values = await Promise.all(
    records.map(async (record) => [record.key, await decryptSecret(payload(record))])
  );
  return Object.fromEntries(values);
}

export async function verifyRuntimeSecretBundle(environmentId: string) {
  const records = await encryptedRecords(environmentId);
  await Promise.all(records.map(async (record) => decryptSecret(payload(record))));
  return records.length;
}
