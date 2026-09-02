import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRuntimeToken } from "../middleware/runtime-auth.js";
import { pushRuntimeSessionRevoke } from "../runtime-websocket.js";
import { writeAudit } from "../services/audit.service.js";
import { recordAppHealth } from "../services/app-runtime.service.js";
import {
  getRuntimeSecretBundle,
  verifyRuntimeSecretBundle,
} from "../services/runtime-secret.service.js";
import {
  authenticateRuntimeToken,
  touchRuntimeToken,
} from "../services/runtime-token.service.js";
import {
  createRuntimeSession,
  revokeRuntimeSession,
} from "../services/runtime-session.service.js";

export const runtimeRouter = Router();
const runtimeSessionSchema = z.object({ projectId: z.string().min(1).max(128) });

function requestedAppId(req: Parameters<typeof requireRuntimeToken>[0]) {
  const appId = req.header("x-passway-app-id")?.trim();
  return appId && appId.length <= 128 ? appId : undefined;
}

runtimeRouter.get("/runtime/secrets", requireRuntimeToken, async (req, res) => {
  // Plaintext secrets leave this endpoint, so any body logger must skip it.
  res.locals.passwayDisableBodyLogging = true;
  try {
    const token = await authenticateRuntimeToken(req.runtimeToken!);
    if (!token || token.environmentStatus !== "hosted") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const appId = requestedAppId(req);
    if (!appId || appId !== token.environmentId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!token.runtimeEnabled) {
      return res.status(423).json({ error: "Vault runtime is disabled" });
    }

    const secrets = await getRuntimeSecretBundle(appId);
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
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

runtimeRouter.post("/runtime/sessions", requireRuntimeToken, async (req, res) => {
  res.locals.passwayDisableBodyLogging = true;
  const input = runtimeSessionSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "Invalid session input" });

  try {
    const session = await createRuntimeSession(
      input.data.projectId,
      req.runtimeToken!,
      req.ip ?? "unknown",
    );
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    return res.status(201).json(session);
  } catch {
    return res.status(500).json({ error: "Secret unavailable" });
  }
});

runtimeRouter.post("/runtime/sessions/:sessionId/revoke", requireAuth, async (req, res) => {
  const sessionId = req.params.sessionId;
  if (!sessionId?.startsWith("sess_")) return res.status(404).json({ error: "Not found" });

  const revoked = await revokeRuntimeSession(sessionId, req.passwayUser!.id, req.ip ?? "unknown");
  if (!revoked) return res.status(404).json({ error: "Not found" });
  pushRuntimeSessionRevoke(sessionId);
  return res.status(204).send();
});

runtimeRouter.get("/runtime/status", requireRuntimeToken, async (req, res) => {
  try {
    const token = await authenticateRuntimeToken(req.runtimeToken!);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    if (token.environmentStatus !== "hosted") {
      return res.status(409).json({ error: "Environment not hosted" });
    }
    const appId = requestedAppId(req);
    if (!appId || appId !== token.environmentId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!token.runtimeEnabled) {
      return res.status(423).json({ error: "Vault runtime is disabled" });
    }

    let secretCount: number;
    try {
      secretCount = await verifyRuntimeSecretBundle(appId);
      if (secretCount === 0) {
        await recordAppHealth(appId, false);
        return res
          .status(422)
          .json({ error: "Secret health verification failed" });
      }
    } catch {
      await recordAppHealth(appId, false);
      return res
        .status(422)
        .json({ error: "Secret health verification failed" });
    }
    const connectedAt = new Date();
    await recordAppHealth(appId, true, connectedAt);
    touchRuntimeToken(token.id);
    await writeAudit({
      environmentId: token.environmentId,
      projectId: token.projectId,
      workspaceId: token.workspaceId,
      accessTokenId: token.id,
      ip: req.ip ?? "unknown",
      action: "APP_CONNECTION_VERIFIED",
    });
    const dashboardBase = (
      process.env.PASSWAY_DASHBOARD_URL ?? "https://app.passway.co.in"
    ).replace(/\/$/, "");
    return res.json({
      connected: true,
      environment: {
        id: token.environmentId,
        name: token.environmentName,
        status: token.environmentStatus,
      },
      app: {
        id: appId,
        name: token.environmentName,
        runtimeStatus: token.runtimeEnabled ? "hosted" : "draft",
        lastConnectedAt: connectedAt,
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
