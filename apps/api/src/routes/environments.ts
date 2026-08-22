import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
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
