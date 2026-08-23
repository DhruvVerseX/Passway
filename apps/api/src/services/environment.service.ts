import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  auditLog,
  environment,
  project,
  workspace,
} from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import { getOwnedEnvironment } from "./environment-access.js";

const environmentTypeSchema = z.enum([
  "development",
  "preview",
  "staging",
  "production",
  "custom",
]);

const environmentInputSchema = z.object({
  name: z.string().trim().min(1).max(128),
  type: environmentTypeSchema,
  description: z.string().trim().max(1_024).optional(),
});

export type EnvironmentInput = z.infer<typeof environmentInputSchema>;

export class EnvironmentInputError extends Error {
  constructor() {
    super("Invalid environment input");
    this.name = "EnvironmentInputError";
  }
}

export class EnvironmentServiceError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "ALREADY_LOCKED"
      | "ALREADY_HOSTED"
      | "NOT_ELIGIBLE"
      | "CONFLICT",
  ) {
    super("Environment operation failed");
    this.name = "EnvironmentServiceError";
  }
}

export function parseEnvironmentInput(input: unknown): EnvironmentInput {
  const parsed = environmentInputSchema.safeParse(input);
  if (!parsed.success) throw new EnvironmentInputError();
  return parsed.data;
}

export function environmentMetadata(record: typeof environment.$inferSelect) {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    type: record.type,
    description: record.description,
    status: record.status,
    lockedAt: record.lockedAt,
    hostedAt: record.hostedAt,
    runtimeEnabled: record.runtimeEnabled,
    runtimeHostedAt: record.runtimeHostedAt,
    runtimeDisabledAt: record.runtimeDisabledAt,
    lastConnectedAt: record.lastConnectedAt,
    lastHealthCheckAt: record.lastHealthCheckAt,
    lastHealthHealthy: record.lastHealthHealthy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getOwnedProject(projectId: string, userId: string) {
  const [owned] = await db
    .select({ projectId: project.id, workspaceId: workspace.id })
    .from(project)
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .where(and(eq(project.id, projectId), eq(workspace.ownerUserId, userId)))
    .limit(1);
  return owned;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function createEnvironment(
  projectId: string,
  userId: string,
  input: EnvironmentInput,
  ip: string,
) {
  const owned = await getOwnedProject(projectId, userId);
  if (!owned) throw new EnvironmentServiceError("NOT_FOUND");

  try {
    const created = await db.transaction(async (tx) => {
      const now = new Date();
      const [record] = await tx
        .insert(environment)
        .values({
          id: crypto.randomUUID(),
          projectId: owned.projectId,
          name: input.name,
          type: input.type,
          description: input.description,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(auditLog).values(
        auditValues({
          environmentId: record.id,
          projectId: owned.projectId,
          workspaceId: owned.workspaceId,
          actorUserId: userId,
          ip,
          action: "BUNDLE_CREATED",
        }),
      );

      return record;
    });
    return environmentMetadata(created);
  } catch (error) {
    if (isUniqueViolation(error)) throw new EnvironmentServiceError("CONFLICT");
    throw error;
  }
}

export async function listEnvironments(projectId: string, userId: string) {
  const owned = await getOwnedProject(projectId, userId);
  if (!owned) throw new EnvironmentServiceError("NOT_FOUND");

  const records = await db
    .select()
    .from(environment)
    .where(eq(environment.projectId, projectId));
  return records.map(environmentMetadata);
}

export async function deleteEnvironment(environmentId: string, userId: string) {
  const current = await getOwnedEnvironment(environmentId, userId);
  if (!current) return false;

  const deleted = await db
    .delete(environment)
    .where(eq(environment.id, environmentId))
    .returning({ id: environment.id });

  return deleted.length > 0;
}

export async function lockEnvironment(
  environmentId: string,
  userId: string,
  ip: string,
) {
  const current = await getOwnedEnvironment(environmentId, userId);
  if (!current) throw new EnvironmentServiceError("NOT_FOUND");
  if (current.status === "hosted")
    throw new EnvironmentServiceError("ALREADY_HOSTED");
  if (current.status === "locked")
    throw new EnvironmentServiceError("ALREADY_LOCKED");
  if (current.status !== "draft")
    throw new EnvironmentServiceError("NOT_ELIGIBLE");

  const now = new Date();
  const locked = await db.transaction(async (tx) => {
    const [record] = await tx
      .update(environment)
      .set({ status: "locked", lockedAt: now, updatedAt: now })
      .where(
        and(eq(environment.id, environmentId), eq(environment.status, "draft")),
      )
      .returning();
    if (!record) return undefined;

    await tx.insert(auditLog).values(
      auditValues({
        environmentId,
        projectId: current.projectId,
        workspaceId: current.workspaceId,
        actorUserId: userId,
        ip,
        action: "ENVIRONMENT_LOCKED",
      }),
    );
    return record;
  });

  if (!locked) throw new EnvironmentServiceError("ALREADY_LOCKED");
  return environmentMetadata(locked);
}
