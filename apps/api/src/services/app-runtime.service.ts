import { and, eq } from "drizzle-orm";
import { accessToken, auditLog, environment } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import { getOwnedEnvironment } from "./environment-access.js";
import { verifyRuntimeSecretBundle } from "./runtime-secret.service.js";

export class AppRuntimeError extends Error {
  constructor(readonly code: "NOT_FOUND" | "ENVIRONMENT_NOT_HOSTED" | "INVALID_CONFIG" | "ALREADY_HOSTED") {
    super("App runtime operation failed");
    this.name = "AppRuntimeError";
  }
}

export async function hostAppRuntime(appId: string, userId: string, ip: string) {
  const owned = await getOwnedEnvironment(appId, userId);
  if (!owned) throw new AppRuntimeError("NOT_FOUND");
  if (owned.status !== "hosted") throw new AppRuntimeError("ENVIRONMENT_NOT_HOSTED");
  if (owned.runtimeEnabled) throw new AppRuntimeError("ALREADY_HOSTED");

  let secretCount: number;
  try {
    secretCount = await verifyRuntimeSecretBundle(appId);
  } catch {
    throw new AppRuntimeError("INVALID_CONFIG");
  }
  if (secretCount === 0) throw new AppRuntimeError("INVALID_CONFIG");

  const now = new Date();
  const record = await db.transaction(async (tx) => {
    const [hosted] = await tx
      .update(environment)
      .set({ runtimeEnabled: true, runtimeHostedAt: now, runtimeDisabledAt: null, updatedAt: now })
      .where(and(eq(environment.id, appId), eq(environment.runtimeEnabled, false)))
      .returning({ id: environment.id, name: environment.name, hostedAt: environment.runtimeHostedAt });
    if (!hosted) return undefined;
    await tx.insert(auditLog).values(auditValues({
      environmentId: appId,
      projectId: owned.projectId,
      workspaceId: owned.workspaceId,
      actorUserId: userId,
      ip,
      action: "APP_RUNTIME_ENABLED",
    }));
    return hosted;
  });
  if (!record) throw new AppRuntimeError("ALREADY_HOSTED");
  return { id: record.id, name: record.name, runtimeStatus: "hosted" as const, hostedAt: record.hostedAt, secretCount };
}

export async function disableAppRuntime(appId: string, userId: string, ip: string) {
  const owned = await getOwnedEnvironment(appId, userId);
  if (!owned) throw new AppRuntimeError("NOT_FOUND");

  const now = new Date();
  const record = await db.transaction(async (tx) => {
    const activeTokens = await tx
      .select({ id: accessToken.id })
      .from(accessToken)
      .where(and(eq(accessToken.environmentId, appId), eq(accessToken.status, "active")));
    const [disabled] = await tx
      .update(environment)
      .set({ runtimeEnabled: false, runtimeDisabledAt: now, updatedAt: now })
      .where(and(eq(environment.id, appId), eq(environment.runtimeEnabled, true)))
      .returning({ id: environment.id, name: environment.name, disabledAt: environment.runtimeDisabledAt });
    if (!disabled) return undefined;
    if (activeTokens.length) {
      await tx
        .update(accessToken)
        .set({ status: "revoked", revoked: true, revokedAt: now })
        .where(and(eq(accessToken.environmentId, appId), eq(accessToken.status, "active")));
    }
    await tx.insert(auditLog).values([
      auditValues({
        environmentId: appId,
        projectId: owned.projectId,
        workspaceId: owned.workspaceId,
        actorUserId: userId,
        ip,
        action: "APP_RUNTIME_DISABLED",
      }),
      ...activeTokens.map((token) =>
        auditValues({
          environmentId: appId,
          projectId: owned.projectId,
          workspaceId: owned.workspaceId,
          actorUserId: userId,
          accessTokenId: token.id,
          ip,
          action: "RUNTIME_TOKEN_REVOKED",
        }),
      ),
    ]);
    return disabled;
  });
  return record && { id: record.id, name: record.name, runtimeStatus: "disabled" as const, disabledAt: record.disabledAt };
}

export function recordAppHealth(appId: string, healthy: boolean, at = new Date()) {
  return db.update(environment).set({
    lastConnectedAt: healthy ? at : undefined,
    lastHealthCheckAt: at,
    lastHealthHealthy: healthy,
    updatedAt: at,
  }).where(eq(environment.id, appId)).execute();
}
