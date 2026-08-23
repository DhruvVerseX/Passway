import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { environment, project, workspace } from "../db/auth-schema.js";

export async function getOwnedEnvironment(environmentId: string, userId: string) {
  const [result] = await db
    .select({
      environmentId: environment.id,
      environmentName: environment.name,
      status: environment.status,
      runtimeEnabled: environment.runtimeEnabled,
      runtimeHostedAt: environment.runtimeHostedAt,
      runtimeDisabledAt: environment.runtimeDisabledAt,
      lastConnectedAt: environment.lastConnectedAt,
      lastHealthCheckAt: environment.lastHealthCheckAt,
      lastHealthHealthy: environment.lastHealthHealthy,
      projectId: project.id,
      workspaceId: workspace.id,
    })
    .from(environment)
    .innerJoin(project, eq(environment.projectId, project.id))
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .where(and(eq(environment.id, environmentId), eq(workspace.ownerUserId, userId)))
    .limit(1);
  return result;
}
