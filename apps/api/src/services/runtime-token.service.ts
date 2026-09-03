import { and, eq } from "drizzle-orm";
import {
  generateToken,
  hashToken,
  looksLikePasswayToken,
} from "../crypto/tokens.js";
import {
  accessToken,
  environment,
  project,
  workspace,
} from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import { getOwnedEnvironment } from "./environment-access.js";
import { auditLog } from "../db/auth-schema.js";

export async function authenticateRuntimeToken(token: string) {
  if (!looksLikePasswayToken(token)) return undefined;

  const [record] = await db
    .select({
      id: accessToken.id,
      createdByUserId: accessToken.createdByUserId,
      environmentId: accessToken.environmentId,
      expiresAt: accessToken.expiresAt,
      status: accessToken.status,
      revoked: accessToken.revoked,
      environmentName: environment.name,
      environmentStatus: environment.status,
      runtimeEnabled: environment.runtimeEnabled,
      runtimeDisabledAt: environment.runtimeDisabledAt,
      projectId: project.id,
      workspaceId: workspace.id,
    })
    .from(accessToken)
    .innerJoin(environment, eq(accessToken.environmentId, environment.id))
    .innerJoin(project, eq(environment.projectId, project.id))
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .where(eq(accessToken.tokenHash, hashToken(token)))
    .limit(1);

  if (
    !record ||
    record.status !== "active" ||
    record.revoked ||
    (record.expiresAt && record.expiresAt.getTime() <= Date.now())
  ) {
    return undefined;
  }
  return record;
}

export async function listRuntimeTokens(environmentId: string, userId: string) {
  const owned = await getOwnedEnvironment(environmentId, userId);
  if (!owned) return undefined;
  const tokens = await db
    .select({
      id: accessToken.id,
      tokenHint: accessToken.tokenHint,
      status: accessToken.status,
      createdAt: accessToken.createdAt,
      lastUsedAt: accessToken.lastUsedAt,
      expiresAt: accessToken.expiresAt,
    })
    .from(accessToken)
    .where(eq(accessToken.environmentId, environmentId));
  return tokens;
}

export async function revokeRuntimeToken(
  environmentId: string,
  tokenId: string,
  userId: string,
  ip: string,
) {
  const owned = await getOwnedEnvironment(environmentId, userId);
  if (!owned) return false;
  const now = new Date();
  const [revoked] = await db
    .update(accessToken)
    .set({ status: "revoked", revoked: true, revokedAt: now })
    .where(
      and(
        eq(accessToken.id, tokenId),
        eq(accessToken.environmentId, environmentId),
        eq(accessToken.status, "active"),
      ),
    )
    .returning({ id: accessToken.id });
  if (!revoked) return false;

  await db.insert(auditLog).values(
    auditValues({
      environmentId,
      projectId: owned.projectId,
      workspaceId: owned.workspaceId,
      actorUserId: userId,
      accessTokenId: tokenId,
      ip,
      action: "RUNTIME_TOKEN_REVOKED",
    }),
  );
  return true;
}

export async function rotateRuntimeToken(
  environmentId: string,
  userId: string,
  ip: string,
) {
  const owned = await getOwnedEnvironment(environmentId, userId);
  if (!owned || owned.status !== "hosted") return undefined;

  const token = generateToken();
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const active = await tx
      .select({ id: accessToken.id })
      .from(accessToken)
      .where(
        and(
          eq(accessToken.environmentId, environmentId),
          eq(accessToken.status, "active"),
        ),
      );

    if (active.length) {
      await tx
        .update(accessToken)
        .set({ status: "revoked", revoked: true, revokedAt: now })
        .where(eq(accessToken.environmentId, environmentId));
    }

    const tokenId = crypto.randomUUID();
    await tx.insert(accessToken).values({
      id: tokenId,
      environmentId,
      tokenHash: hashToken(token),
      tokenHint: `${token.slice(0, 16)}...`,
      label: "Rotated runtime token",
      status: "active",
      revoked: false,
      createdByUserId: userId,
      createdAt: now,
    });

    await tx.insert(auditLog).values([
      ...active.map((item) =>
        auditValues({
          environmentId,
          projectId: owned.projectId,
          workspaceId: owned.workspaceId,
          actorUserId: userId,
          accessTokenId: item.id,
          ip,
          action: "RUNTIME_TOKEN_REVOKED",
        }),
      ),
      auditValues({
        environmentId,
        projectId: owned.projectId,
        workspaceId: owned.workspaceId,
        actorUserId: userId,
        accessTokenId: tokenId,
        ip,
        action: "RUNTIME_TOKEN_CREATED",
      }),
    ]);

    return { tokenId, createdAt: now };
  });

  return {
    environmentId,
    status: "hosted" as const,
    token,
    createdAt: result.createdAt,
  };
}

export function touchRuntimeToken(tokenId: string) {
  // ponytail: per-request best effort; queue this when audit-volume warrants it.
  void db
    .update(accessToken)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(accessToken.id, tokenId), eq(accessToken.status, "active")))
    .execute()
    .catch(() => undefined);
}
