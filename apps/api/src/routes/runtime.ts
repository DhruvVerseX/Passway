import { Router } from "express";
import { requireRuntimeToken } from "../middleware/runtime-auth.js";
import { writeAudit } from "../services/audit.service.js";
import { getRuntimeSecretBundle } from "../services/runtime-secret.service.js";
import { authenticateRuntimeToken, touchRuntimeToken } from "../services/runtime-token.service.js";

export const runtimeRouter = Router();

runtimeRouter.get("/runtime/secrets", requireRuntimeToken, async (req, res) => {
  try {
    const token = await authenticateRuntimeToken(req.runtimeToken!);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const secrets = await getRuntimeSecretBundle(token.environmentId);
    touchRuntimeToken(token.id);
    await Promise.all([
      writeAudit({
        environmentId: token.environmentId,
        projectId: token.projectId,
        workspaceId: token.workspaceId,
        accessTokenId: token.id,
        ip: req.ip ?? "unknown",
        action: "RUNTIME_TOKEN_USED",
      }),
      writeAudit({
        environmentId: token.environmentId,
        projectId: token.projectId,
        workspaceId: token.workspaceId,
        accessTokenId: token.id,
        ip: req.ip ?? "unknown",
        action: "RUNTIME_SECRET_BUNDLE_READ",
      }),
    ]);
    return res.json(secrets);
  } catch {
    return res.status(500).json({ error: "Secret unavailable" });
  }
});
