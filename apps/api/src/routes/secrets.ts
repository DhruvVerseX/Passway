import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { requireToken } from "../middleware/auth.js";
import { SecretInputError, secretService } from "../services/secret.service.js";
import { logAudit } from "../services/auditLog.js";
import { store } from "../store/db.js";

export const secretsRouter = Router();

/* ---------------- Admin: manage secrets from the dashboard ---------------- */

secretsRouter.post("/admin/secrets", requireAdmin, async (req, res) => {
  try {
    const input = secretService.parseWriteInput(req.body);
    const existing = secretService.getMetadata(input);
    const secret = existing
      ? await secretService.update(input)
      : await secretService.create(input);
    const action = existing ? "SECRET_UPDATED" : "SECRET_CREATED";
    logAudit(req, {
      token: undefined,
      project: input.project,
      environment: input.environment,
      secretKey: input.key,
      action,
      result: "allowed",
    });
    return res.status(existing ? 200 : 201).json({ secret });
  } catch (error) {
    if (error instanceof SecretInputError) return res.status(400).json({ error: "invalid_secret_input" });
    return res.status(500).json({ error: "secret_unavailable" });
  }
});

secretsRouter.get("/admin/secrets", requireAdmin, (req, res) => {
  try {
    const scope = secretService.parseScope(req.query);
    return res.json({ secrets: secretService.list(scope) });
  } catch (error) {
    if (error instanceof SecretInputError) return res.status(400).json({ error: "invalid_secret_scope" });
    return res.status(500).json({ error: "secret_unavailable" });
  }
});

secretsRouter.post("/admin/secrets/:key/reveal", requireAdmin, async (req, res) => {
  let scope: ReturnType<typeof secretService.parseScope> | undefined;
  try {
    scope = secretService.parseScope(req.body);
    const secret = await secretService.getValue({ ...scope, key: req.params.key });
    if (!secret) return res.status(404).json({ error: "not_found" });
    logAudit(req, {
      token: undefined,
      project: scope.project,
      environment: scope.environment,
      secretKey: req.params.key,
      action: "SECRET_READ",
      result: "allowed",
    });
    return res.json({ key: secret.metadata.key, value: secret.value });
  } catch (error) {
    if (error instanceof SecretInputError) return res.status(400).json({ error: "invalid_secret_scope" });
    if (scope) {
      logAudit(req, {
        token: undefined,
        project: scope.project,
        environment: scope.environment,
        secretKey: req.params.key,
        action: "SECRET_READ",
        result: "denied",
        reason: "secret_unavailable",
      });
    }
    return res.status(500).json({ error: "secret_unavailable" });
  }
});

secretsRouter.delete("/admin/secrets/:key", requireAdmin, (req, res) => {
  try {
    const scope = secretService.parseScope(req.query);
    const secret = secretService.delete({ ...scope, key: req.params.key });
    if (!secret) return res.status(404).json({ error: "not_found" });
    logAudit(req, {
      token: undefined,
      project: scope.project,
      environment: scope.environment,
      secretKey: req.params.key,
      action: "SECRET_DELETED",
      result: "allowed",
    });
    return res.status(204).send();
  } catch (error) {
    if (error instanceof SecretInputError) return res.status(400).json({ error: "invalid_secret_scope" });
    return res.status(500).json({ error: "secret_unavailable" });
  }
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

  try {
    const scope = secretService.parseScope({ project, environment });
    const secret = await secretService.getValue({ ...scope, key });
    if (!secret) {
      logAudit(req, { token, project, environment, secretKey: key, action: "SECRET_READ", result: "denied", reason: "not_found" });
      return res.status(404).json({ error: "secret_not_found" });
    }

    store.touchTokenLastUsed(token.id);
    logAudit(req, { token, project, environment, secretKey: key, action: "SECRET_READ", result: "allowed" });
    return res.json({ key, value: secret.value });
  } catch (error) {
    logAudit(req, { token, project, environment, secretKey: key, action: "SECRET_READ", result: "denied", reason: "secret_unavailable" });
    return res.status(500).json({ error: "secret_unavailable" });
  }
});
