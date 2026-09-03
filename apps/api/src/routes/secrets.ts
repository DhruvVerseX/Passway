import { Router, text } from "express";
import { requireAuth, requireRecentAuth } from "../middleware/require-auth.js";
import { writeAudit } from "../services/audit.service.js";
import {
  SecretAccessError,
  SecretConflictError,
  SecretInputError,
  secretService,
} from "../services/secret.service.js";

export const secretsRouter = Router();

function handleSecretError(
  error: unknown,
  res: Parameters<Parameters<typeof secretsRouter.post>[1]>[1],
) {
  if (error instanceof SecretInputError) {
    return res.status(400).json({ error: "Invalid secret input" });
  }
  if (error instanceof SecretConflictError) {
    return res.status(409).json({
      error: "One or more secret keys already exist",
      keys: error.keys,
    });
  }
  if (error instanceof SecretAccessError) {
    if (error.code === "LOCKED")
      return res.status(409).json({ error: "Environment is locked" });
    return res.status(404).json({ error: "Not found" });
  }
  return undefined;
}

secretsRouter.post(
  "/environments/:environmentId/secrets",
  requireAuth,
  requireRecentAuth,
  async (req, res) => {
    try {
      const input = secretService.parseWriteInput(req.body);
      const result = await secretService.createOrUpdate(
        req.params.environmentId,
        req.passwayUser!.id,
        input,
      );
      await writeAudit({
        environmentId: req.params.environmentId,
        projectId: result.environment.projectId,
        workspaceId: result.environment.workspaceId,
        actorUserId: req.passwayUser!.id,
        secretKey: input.key,
        ip: req.ip ?? "unknown",
        action: result.action,
      });
      return res.status(201).json({ secret: result.secret });
    } catch (error) {
      const response = handleSecretError(error, res);
      if (response) return response;
      throw error;
    }
  },
);

secretsRouter.post(
  "/environments/:environmentId/import",
  text({ type: ["text/plain", "application/octet-stream"], limit: "512kb" }),
  requireAuth,
  requireRecentAuth,
  async (req, res) => {
    try {
      if (typeof req.body !== "string") {
        return res
          .status(400)
          .json({ error: "Import body must be raw .env text" });
      }
      const parsed = secretService.parseImport(req.body);
      const result = await secretService.importMany(
        req.params.environmentId,
        req.passwayUser!.id,
        parsed,
        req.ip ?? "unknown",
      );
      return res.status(201).json({
        imported: result.secrets.length,
        secrets: result.secrets.map(({ key }) => ({ key })),
      });
    } catch (error) {
      const response = handleSecretError(error, res);
      if (response) return response;
      throw error;
    }
  },
);

secretsRouter.get(
  "/environments/:environmentId/secrets",
  requireAuth,
  async (req, res) => {
    try {
      const result = await secretService.list(
        req.params.environmentId,
        req.passwayUser!.id,
      );
      return res.json({ secrets: result.secrets });
    } catch (error) {
      const response = handleSecretError(error, res);
      if (response) return response;
      throw error;
    }
  },
);

secretsRouter.delete(
  "/environments/:environmentId/secrets/:key",
  requireAuth,
  requireRecentAuth,
  async (req, res) => {
    try {
      const result = await secretService.delete(
        req.params.environmentId,
        req.passwayUser!.id,
        req.params.key,
      );
      if (!result.secret) return res.status(404).json({ error: "Not found" });
      await writeAudit({
        environmentId: req.params.environmentId,
        projectId: result.environment.projectId,
        workspaceId: result.environment.workspaceId,
        actorUserId: req.passwayUser!.id,
        secretKey: req.params.key,
        ip: req.ip ?? "unknown",
        action: "SECRET_DELETED",
      });
      return res.status(204).send();
    } catch (error) {
      const response = handleSecretError(error, res);
      if (response) return response;
      throw error;
    }
  },
);
