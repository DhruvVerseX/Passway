import { and, eq, ne } from "drizzle-orm";
import { rotateSecret } from "../crypto/envelope.js";
import { kms } from "../crypto/kms.js";
import { secret } from "../db/auth-schema.js";
import { closeDatabase, db } from "../db/index.js";

async function main() {
  const target = kms.activeKeyVersion;
  let rotated = 0;
  for (;;) {
    const rows = await db.select().from(secret).where(ne(secret.keyVersion, target)).limit(100);
    if (!rows.length) break;
    for (const row of rows) {
      const updated = await rotateSecret({
        version: row.payloadVersion as 1,
        keyVersion: row.keyVersion,
        algorithm: row.algorithm as "AES-256-GCM",
        ciphertext: row.ciphertext,
        iv: row.iv,
        authTag: row.authTag,
        wrappedDataKey: row.wrappedDataKey,
      }, target);
      const changed = await db.update(secret)
        .set({ keyVersion: target, wrappedDataKey: updated.wrappedDataKey, updatedAt: new Date() })
        .where(and(eq(secret.id, row.id), eq(secret.keyVersion, row.keyVersion), eq(secret.wrappedDataKey, row.wrappedDataKey)))
        .returning({ id: secret.id });
      rotated += changed.length;
    }
  }
  console.log(`Rewrapped ${rotated} secrets with key version ${target}.`);
}

try {
  await main();
} catch {
  console.error("Key rotation failed. Keep all old master keys configured and retry.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
