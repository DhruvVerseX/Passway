import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.js";
import { writeAudit } from "../services/audit.service.js";
import { SecretAccessError, SecretInputError, secretService } from "../services/secret.service.js";

export const secretsRouter = Router();

secretsRouter.post("/environments/:environmentId/secrets", requireAuth, async (req, res) => {
  try {
    const input = secretService.parseWriteInput(req.body);
    const result = await secretService.createOrUpdate(req.params.environmentId, req.passwayUser!.id, input);
    await writeAudit({
      environmentId: req.params.environmentId,
      projectId: result.environment.projectId,
      workspaceId: result.environment.workspaceId,
      actorUserId: req.passwayUser!.id,
      secretKey: input.key,
      ip: req.ip ?? "unknown",
      action: result.action,
    });
    return res.status(result.action === "SECRET_CREATED" ? 201 : 200).json({ secret: result.secret });
  } catch (error) {
    if (error instanceof SecretInputError) return res.status(400).json({ error: "Invalid secret input" });
    if (error instanceof SecretAccessError && error.code === "LOCKED") {
      return res.status(409).json({ error: "Environment is locked" });
    }
    return res.status(404).json({ error: "Not found" });
  }
});

secretsRouter.get("/environments/:environmentId/secrets", requireAuth, async (req, res) => {
  try {
    const result = await secretService.list(req.params.environmentId, req.passwayUser!.id);
    return res.json({ secrets: result.secrets });
  } catch {
    return res.status(404).json({ error: "Not found" });
  }
});

secretsRouter.delete("/environments/:environmentId/secrets/:key", requireAuth, async (req, res) => {
  try {
    const result = await secretService.delete(req.params.environmentId, req.passwayUser!.id, req.params.key);
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
    if (error instanceof SecretAccessError && error.code === "LOCKED") {
      return res.status(409).json({ error: "Environment is locked" });
    }
    return res.status(404).json({ error: "Not found" });
  }
});
