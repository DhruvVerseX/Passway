import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import {
  AppRuntimeError,
  disableAppRuntime,
  hostAppRuntime,
} from "../services/app-runtime.service.js";
import {
  EnvironmentHostingError,
  hostEnvironment,
} from "../services/environment-hosting.service.js";
import {
  deleteEnvironment,
  EnvironmentServiceError,
  lockEnvironment,
} from "../services/environment.service.js";
import {
  listRuntimeTokens,
  revokeRuntimeToken,
  rotateRuntimeToken,
} from "../services/runtime-token.service.js";

export const environmentsRouter = Router();

function appRuntimeError(error: unknown, res: Parameters<Parameters<typeof environmentsRouter.post>[1]>[1]) {
  if (!(error instanceof AppRuntimeError)) return undefined;
  if (error.code === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
  if (error.code === "ENVIRONMENT_NOT_HOSTED") return res.status(409).json({ error: "Environment is not hosted" });
  if (error.code === "INVALID_CONFIG") return res.status(422).json({ error: "Vault has no valid encrypted configuration" });
  return res.status(409).json({ error: "Vault runtime is already hosted" });
}

environmentsRouter.post("/apps/:appId/host", requireAuth, async (req, res) => {
  try {
    return res.status(201).json(await hostAppRuntime(req.params.appId, req.passwayUser!.id, req.ip ?? "unknown"));
  } catch (error) {
    const response = appRuntimeError(error, res);
    if (response) return response;
    throw error;
  }
});

environmentsRouter.post("/apps/:appId/disable-runtime", requireAuth, async (req, res) => {
  try {
    const disabled = await disableAppRuntime(req.params.appId, req.passwayUser!.id, req.ip ?? "unknown");
    if (!disabled) return res.status(409).json({ error: "Vault runtime is not hosted" });
    return res.json(disabled);
  } catch (error) {
    const response = appRuntimeError(error, res);
    if (response) return response;
    throw error;
  }
});

environmentsRouter.delete(
  "/environments/:environmentId",
  requireAuth,
  async (req, res) => {
    const deleted = await deleteEnvironment(
      req.params.environmentId,
      req.passwayUser!.id,
    );
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.status(204).send();
  },
);

environmentsRouter.post(
  "/environments/:environmentId/lock",
  requireAuth,
  async (req, res) => {
    try {
      const locked = await lockEnvironment(
        req.params.environmentId,
        req.passwayUser!.id,
        req.ip ?? "unknown",
      );
      return res.json({ environment: locked });
    } catch (error) {
      if (error instanceof EnvironmentServiceError) {
        if (error.code === "NOT_FOUND")
          return res.status(404).json({ error: "Not found" });
        if (error.code === "ALREADY_LOCKED") {
          return res.status(409).json({ error: "Environment already locked" });
        }
        if (error.code === "ALREADY_HOSTED") {
          return res.status(409).json({ error: "Environment already hosted" });
        }
      }
      return res.status(409).json({ error: "Environment cannot be locked" });
    }
  },
);

environmentsRouter.post(
  "/environments/:environmentId/host",
  requireAuth,
  async (req, res) => {
    try {
      const hosted = await hostEnvironment(
        req.params.environmentId,
        req.passwayUser!.id,
        req.ip ?? "unknown",
      );
      return res.status(201).json(hosted);
    } catch (error) {
      if (
        error instanceof EnvironmentHostingError &&
        error.code === "ALREADY_HOSTED"
      ) {
        return res.status(409).json({ error: "Environment already hosted" });
      }
      if (
        error instanceof EnvironmentHostingError &&
        error.code === "NOT_ELIGIBLE"
      ) {
        return res
          .status(409)
          .json({ error: "Environment is not ready to host" });
      }
      return res.status(404).json({ error: "Not found" });
    }
  },
);

environmentsRouter.post(
  "/environments/:environmentId/runtime-tokens/rotate",
  requireAuth,
  async (req, res) => {
    const rotated = await rotateRuntimeToken(
      req.params.environmentId,
      req.passwayUser!.id,
      req.ip ?? "unknown",
    );
    if (!rotated) {
      return res.status(404).json({ error: "Hosted environment not found" });
    }
    return res.status(201).json(rotated);
  },
);

environmentsRouter.get(
  "/environments/:environmentId/runtime-tokens",
  requireAuth,
  async (req, res) => {
    const tokens = await listRuntimeTokens(
      req.params.environmentId,
      req.passwayUser!.id,
    );
    if (!tokens) return res.status(404).json({ error: "Not found" });
    return res.json({ tokens });
  },
);

environmentsRouter.delete(
  "/environments/:environmentId/runtime-tokens/:tokenId",
  requireAuth,
  async (req, res) => {
    const revoked = await revokeRuntimeToken(
      req.params.environmentId,
      req.params.tokenId,
      req.passwayUser!.id,
      req.ip ?? "unknown",
    );
    if (!revoked) return res.status(404).json({ error: "Not found" });
    return res.status(204).send();
  },
);
