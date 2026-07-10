import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { requireToken } from "../middleware/auth.js";
import { encryptSecret, decryptSecret } from "../crypto/envelope.js";
import { store, newId } from "../store/db.js";
import { logAudit } from "../services/auditLog.js";

export const secretsRouter = Router();

/* ---------------- Admin: manage secrets from the dashboard ---------------- */

secretsRouter.post("/admin/secrets", requireAdmin, async (req, res) => {
  const { project, environment, key, value } = req.body ?? {};
  if (!project || !environment || !key || typeof value !== "string") {
    return res
      .status(400)
      .json({ error: "project, environment, key, value are all required" });
  }

  const enc = await encryptSecret(value);
  const now = new Date().toISOString();
  const existing = store.getSecret(project, environment, key);

  store.putSecret({
    id: existing?.id ?? newId(),
    project,
    environment,
    key,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...enc,
  });

  return res.status(201).json({ project, environment, key, updatedAt: now });
});

secretsRouter.get("/admin/secrets", requireAdmin, (req, res) => {
  const { project, environment } = req.query;
  if (typeof project !== "string" || typeof environment !== "string") {
    return res.status(400).json({ error: "project and environment query params required" });
  }
  const secrets = store.listSecrets(project, environment).map((s) => ({
    key: s.key,
    project: s.project,
    environment: s.environment,
    updatedAt: s.updatedAt,
    // Deliberately never returned here: ciphertext, iv, authTag, wrappedDataKey.
    // The admin list view shows metadata only — revealing a value is a
    // separate, explicit action below, and still requires the admin key.
  }));
  return res.json({ secrets });
});

secretsRouter.post("/admin/secrets/:key/reveal", requireAdmin, async (req, res) => {
  const { project, environment } = req.body ?? {};
  const record = store.getSecret(project, environment, req.params.key);
  if (!record) return res.status(404).json({ error: "not_found" });
  const value = await decryptSecret(record);
  return res.json({ key: record.key, value });
});

secretsRouter.delete("/admin/secrets/:key", requireAdmin, (req, res) => {
  const { project, environment } = req.query;
  if (typeof project !== "string" || typeof environment !== "string") {
    return res.status(400).json({ error: "project and environment query params required" });
  }
  store.deleteSecret(project, environment, req.params.key);
  return res.status(204).send();
});

/* ---------------- Runtime: what a consuming app actually calls ---------------- */

/**
 * This is the endpoint from the architecture diagram: token in, one
 * authenticated HTTPS call, secret out over TLS, audit entry written
 * regardless of outcome. No client-side decryption, no bundled algorithm,
 * no "no request" shortcut — this call IS the security boundary.
 */
secretsRouter.get("/secrets/:key", requireToken, async (req, res) => {
  const token = req.passwayToken!;
  const { project, environment } = token;
  const key = req.params.key;

  const record = store.getSecret(project, environment, key);

  if (!record) {
    logAudit(req, { token, project, environment, secretKey: key, result: "denied", reason: "not_found" });
    return res.status(404).json({ error: "secret_not_found" });
  }

  const value = await decryptSecret(record);
  store.touchTokenLastUsed(token.id);
  logAudit(req, { token, project, environment, secretKey: key, result: "allowed" });

  return res.json({ key, value });
});
