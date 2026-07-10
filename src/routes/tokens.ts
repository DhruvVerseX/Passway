import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { generateToken, hashToken } from "../crypto/tokens.js";
import { store, newId } from "../store/db.js";

export const tokensRouter = Router();

tokensRouter.post("/admin/tokens", requireAdmin, (req, res) => {
  const { project, environment, label, expiresInDays } = req.body ?? {};
  if (!project || !environment) {
    return res.status(400).json({ error: "project and environment are required" });
  }

  const raw = generateToken();
  const now = new Date();
  const expiresAt = expiresInDays
    ? new Date(now.getTime() + expiresInDays * 86_400_000).toISOString()
    : null;

  store.createToken({
    id: newId(),
    tokenHash: hashToken(raw),
    label: label ?? `${project}/${environment}`,
    project,
    environment,
    createdAt: now.toISOString(),
    expiresAt,
    revoked: false,
    lastUsedAt: null,
  });

  // The raw token is returned exactly once, right here. It is never
  // recoverable from the API again — only its hash exists after this.
  return res.status(201).json({ token: raw, expiresAt });
});

tokensRouter.get("/admin/tokens", requireAdmin, (_req, res) => {
  const tokens = store.listTokens().map((t) => ({
    id: t.id,
    label: t.label,
    project: t.project,
    environment: t.environment,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
    revoked: t.revoked,
    lastUsedAt: t.lastUsedAt,
    // tokenHash intentionally omitted from the response
  }));
  return res.json({ tokens });
});

tokensRouter.delete("/admin/tokens/:id", requireAdmin, (req, res) => {
  const revoked = store.revokeToken(req.params.id);
  if (!revoked) return res.status(404).json({ error: "not_found" });
  return res.status(204).send();
});
