import { Router } from "express";
import { requireRuntimeToken } from "../middleware/runtime-auth.js";
import { writeAudit } from "../services/audit.service.js";
import { getRuntimeSecretBundle, verifyRuntimeSecretBundle } from "../services/runtime-secret.service.js";
import { authenticateRuntimeToken, touchRuntimeToken } from "../services/runtime-token.service.js";

export const runtimeRouter = Router();

runtimeRouter.get("/runtime/secrets", requireRuntimeToken, async (req, res) => {
  try {
    const token = await authenticateRuntimeToken(req.runtimeToken!);
    if (!token || token.environmentStatus !== "hosted") {
      return res.status(401).json({ error: "Unauthorized" });
    }

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

runtimeRouter.get("/runtime/status", requireRuntimeToken, async (req, res) => {
  try {
    const token = await authenticateRuntimeToken(req.runtimeToken!);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    if (token.environmentStatus !== "hosted") {
      return res.status(409).json({ error: "Environment not hosted" });
    }

    let secretCount: number;
    try {
      secretCount = await verifyRuntimeSecretBundle(token.environmentId);
      if (secretCount === 0) return res.status(422).json({ error: "Secret health verification failed" });
    } catch {
      return res.status(422).json({ error: "Secret health verification failed" });
    }
    touchRuntimeToken(token.id);
    await writeAudit({
      environmentId: token.environmentId,
      projectId: token.projectId,
      workspaceId: token.workspaceId,
      accessTokenId: token.id,
      ip: req.ip ?? "unknown",
      action: "RUNTIME_CONNECTION_VERIFIED",
    });
    const dashboardBase = (process.env.PASSWAY_DASHBOARD_URL ?? "https://app.passway.co.in").replace(/\/$/, "");
    return res.json({
      connected: true,
      environment: {
        id: token.environmentId,
        name: token.environmentName,
        status: token.environmentStatus,
      },
      secretCount,
      delivery: "verified",
      health: "healthy",
      healthUrl: `${dashboardBase}/dashboard/${token.environmentId}`,
    });
  } catch {
    return res.status(500).json({ error: "Secret unavailable" });
  }
});
