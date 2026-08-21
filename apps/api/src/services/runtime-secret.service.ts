import { eq } from "drizzle-orm";
import { decryptSecret } from "../crypto/envelope.js";
import { secret } from "../db/auth-schema.js";
import { db } from "../db/index.js";

export async function getRuntimeSecretBundle(environmentId: string) {
  const records = await db
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

  const values = await Promise.all(
    records.map(async (record) => [
      record.key,
      await decryptSecret({
        version: record.payloadVersion as 1,
        keyVersion: record.keyVersion,
        algorithm: record.algorithm as "AES-256-GCM",
        ciphertext: record.ciphertext,
        iv: record.iv,
        authTag: record.authTag,
        wrappedDataKey: record.wrappedDataKey,
      }),
    ])
  );
  return Object.fromEntries(values);
}
