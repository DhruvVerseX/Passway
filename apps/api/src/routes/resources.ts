import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { project, workspace } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireAuth, requireRecentAuth } from "../middleware/require-auth.js";
import { redactKnownSecrets } from "../redact.js";
import {
  createEnvironment,
  EnvironmentInputError,
  EnvironmentServiceError,
  listEnvironments,
  parseEnvironmentInput,
} from "../services/environment.service.js";

const workspaceSchema = z.object({
  name: z.string().min(1).max(128),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{3,64}$/)
    .optional(),
});

const projectSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(1_024).optional(),
});

export const resourcesRouter = Router();

resourcesRouter.get("/projects", requireAuth, async (req, res) => {
  const projects = await db
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
    })
    .from(project)
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .where(eq(workspace.ownerUserId, req.passwayUser!.id));
  return res.json({ projects });
});

resourcesRouter.post("/bootstrap", requireAuth, async (req, res) => {
  const [existing] = await db
    .select({ id: project.id })
    .from(project)
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .where(eq(workspace.ownerUserId, req.passwayUser!.id))
    .limit(1);
  if (existing) return res.json({ project: existing, created: false });

  try {
    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const [createdWorkspace] = await tx
        .insert(workspace)
        .values({
          id: crypto.randomUUID(),
          ownerUserId: req.passwayUser!.id,
          name: "Passway Workspace",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const [createdProject] = await tx
        .insert(project)
        .values({
          id: crypto.randomUUID(),
          workspaceId: createdWorkspace.id,
          name: "Primary Project",
          description: "Your first Passway project.",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return {
        workspace: createdWorkspace,
        project: createdProject,
        created: true,
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (["42703", "42P01", "42710"].includes(code)) {
      return res.status(503).json({
        error:
          "Passway database migration is required. Run `bun run --cwd apps/api db:migrate` and restart the API.",
      });
    }
    console.error("Passway bootstrap failed", redactKnownSecrets(error));
    return res
      .status(500)
      .json({ error: "Unable to initialize the Passway workspace." });
  }
});

resourcesRouter.post("/workspaces", requireAuth, async (req, res) => {
  const input = workspaceSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Invalid workspace input" });

  try {
    const [created] = await db
      .insert(workspace)
      .values({
        id: crypto.randomUUID(),
        ownerUserId: req.passwayUser!.id,
        ...input.data,
      })
      .returning();
    return res.status(201).json({ workspace: created });
  } catch {
    return res.status(409).json({ error: "Workspace already exists" });
  }
});

resourcesRouter.post(
  "/workspaces/:workspaceId/projects",
  requireAuth,
  async (req, res) => {
    const input = projectSchema.safeParse(req.body);
    if (!input.success)
      return res.status(400).json({ error: "Invalid project input" });

    const [owned] = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(
        and(
          eq(workspace.id, req.params.workspaceId),
          eq(workspace.ownerUserId, req.passwayUser!.id),
        ),
      )
      .limit(1);
    if (!owned) return res.status(404).json({ error: "Not found" });

    try {
      const now = new Date();
      const [created] = await db
        .insert(project)
        .values({
          id: crypto.randomUUID(),
          workspaceId: owned.id,
          ...input.data,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return res.status(201).json({ project: created });
    } catch {
      return res.status(409).json({ error: "Project already exists" });
    }
  },
);

resourcesRouter.post(
  "/projects/:projectId/environments",
  requireAuth,
  requireRecentAuth,
  async (req, res) => {
    let input;
    try {
      input = parseEnvironmentInput(req.body);
    } catch (error) {
      if (error instanceof EnvironmentInputError) {
        return res.status(400).json({ error: "Invalid environment input" });
      }
      throw error;
    }

    try {
      const created = await createEnvironment(
        req.params.projectId,
        req.passwayUser!.id,
        input,
        req.ip ?? "unknown",
      );
      return res.status(201).json({ environment: created });
    } catch (error) {
      if (error instanceof EnvironmentServiceError) {
        if (error.code === "CONFLICT") {
          return res.status(409).json({ error: "Environment already exists" });
        }
        if (error.code === "NOT_FOUND")
          return res.status(404).json({ error: "Not found" });
      }
      throw error;
    }
  },
);

resourcesRouter.get(
  "/projects/:projectId/environments",
  requireAuth,
  async (req, res) => {
    try {
      const environments = await listEnvironments(
        req.params.projectId,
        req.passwayUser!.id,
      );
      return res.json({ environments });
    } catch (error) {
      if (
        error instanceof EnvironmentServiceError &&
        error.code === "NOT_FOUND"
      ) {
        return res.status(404).json({ error: "Not found" });
      }
      throw error;
    }
  },
);
