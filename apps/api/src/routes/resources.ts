import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { environment, project, workspace } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";

const workspaceSchema = z.object({
  name: z.string().min(1).max(128),
  slug: z.string().regex(/^[a-z0-9-]{3,64}$/).optional(),
});

const projectSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(1_024).optional(),
});

const environmentSchema = z.object({
  name: z.enum(["development", "staging", "production"]),
});

export const resourcesRouter = Router();

resourcesRouter.post("/workspaces", requireAuth, async (req, res) => {
  const input = workspaceSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "Invalid workspace input" });
  try {
    const [created] = await db
      .insert(workspace)
      .values({ id: crypto.randomUUID(), ownerUserId: req.passwayUser!.id, ...input.data })
      .returning();
    return res.status(201).json({ workspace: created });
  } catch {
    return res.status(409).json({ error: "Workspace already exists" });
  }
});

resourcesRouter.post("/workspaces/:workspaceId/projects", requireAuth, async (req, res) => {
  const input = projectSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "Invalid project input" });
  const [owned] = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(and(eq(workspace.id, req.params.workspaceId), eq(workspace.ownerUserId, req.passwayUser!.id)))
    .limit(1);
  if (!owned) return res.status(404).json({ error: "Not found" });

  try {
    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const [created] = await tx
        .insert(project)
        .values({ id: crypto.randomUUID(), workspaceId: owned.id, ...input.data, createdAt: now, updatedAt: now })
        .returning();
      const [development] = await tx
        .insert(environment)
        .values({ id: crypto.randomUUID(), projectId: created.id, name: "development", createdAt: now, updatedAt: now })
        .returning();
      return { project: created, environment: development };
    });
    return res.status(201).json(result);
  } catch {
    return res.status(409).json({ error: "Project already exists" });
  }
});

resourcesRouter.post("/projects/:projectId/environments", requireAuth, async (req, res) => {
  const input = environmentSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "Invalid environment input" });
  const [owned] = await db
    .select({ projectId: project.id })
    .from(project)
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .where(and(eq(project.id, req.params.projectId), eq(workspace.ownerUserId, req.passwayUser!.id)))
    .limit(1);
  if (!owned) return res.status(404).json({ error: "Not found" });

  try {
    const [created] = await db
      .insert(environment)
      .values({ id: crypto.randomUUID(), projectId: owned.projectId, name: input.data.name })
      .returning();
    return res.status(201).json({ environment: created });
  } catch {
    return res.status(409).json({ error: "Environment already exists" });
  }
});
