import { and, eq, lt } from "drizzle-orm";
import { generateToken, hashToken, looksLikePasswayToken } from "../crypto/tokens.js";
import { auditLog, runtimeSession, workspace } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import { getRuntimeSecretBundle } from "./runtime-secret.service.js";
import { authenticateRuntimeToken, touchRuntimeToken } from "./runtime-token.service.js";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const HEARTBEAT_TIMEOUT_MS = 45_000;

export async function createRuntimeSession(projectId: string, tokenValue: string, ip: string) {
  const token = await authenticateRuntimeToken(tokenValue);
  if (!token || token.environmentStatus !== "hosted") return undefined;
  if (projectId !== token.environmentId && projectId !== token.projectId) return undefined;
  if (!token.runtimeEnabled) return undefined;

  const sessionId = `sess_${crypto.randomUUID()}`;
  const sessionToken = generateToken();
  const now = new Date();
  const secrets = await getRuntimeSecretBundle(token.environmentId);

  await db.transaction(async (tx) => {
    await tx.insert(runtimeSession).values({
      sessionId,
      environmentId: token.environmentId,
      projectId: token.projectId,
      workspaceId: token.workspaceId,
      accessTokenId: token.id,
      sessionTokenHash: hashToken(sessionToken),
      status: "active",
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      createdAt: now,
      lastHeartbeatAt: now,
    });
    await tx.insert(auditLog).values(auditValues({
      environmentId: token.environmentId,
      projectId: token.projectId,
      workspaceId: token.workspaceId,
      accessTokenId: token.id,
      ip,
      action: "RUNTIME_SESSION_CREATED",
    }));
  });
  touchRuntimeToken(token.id);
  return { sessionId, sessionToken, secrets };
}

export async function authenticateRuntimeSession(sessionId: string, sessionToken: string) {
  if (!looksLikePasswayToken(sessionToken)) return undefined;
  const [session] = await db
    .select({
      sessionId: runtimeSession.sessionId,
      environmentId: runtimeSession.environmentId,
      projectId: runtimeSession.projectId,
      workspaceId: runtimeSession.workspaceId,
      accessTokenId: runtimeSession.accessTokenId,
      status: runtimeSession.status,
      expiresAt: runtimeSession.expiresAt,
    })
    .from(runtimeSession)
    .where(and(
      eq(runtimeSession.sessionId, sessionId),
      eq(runtimeSession.sessionTokenHash, hashToken(sessionToken)),
    ))
    .limit(1);

  if (!session || session.status !== "active") return undefined;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db
      .update(runtimeSession)
      .set({ status: "expired" })
      .where(and(eq(runtimeSession.sessionId, sessionId), eq(runtimeSession.status, "active")));
    return undefined;
  }
  return session;
}

export function touchRuntimeSessionHeartbeat(sessionId: string) {
  return db
    .update(runtimeSession)
    .set({ lastHeartbeatAt: new Date() })
    .where(and(eq(runtimeSession.sessionId, sessionId), eq(runtimeSession.status, "active")))
    .execute();
}

export async function revokeRuntimeSession(sessionId: string, userId: string, ip: string) {
  const [owned] = await db
    .select({
      environmentId: runtimeSession.environmentId,
      projectId: runtimeSession.projectId,
      workspaceId: runtimeSession.workspaceId,
      accessTokenId: runtimeSession.accessTokenId,
    })
    .from(runtimeSession)
    .innerJoin(workspace, eq(runtimeSession.workspaceId, workspace.id))
    .where(and(eq(runtimeSession.sessionId, sessionId), eq(workspace.ownerUserId, userId)))
    .limit(1);
  if (!owned) return false;

  const [revoked] = await db
    .update(runtimeSession)
    .set({ status: "revoked" })
    .where(and(eq(runtimeSession.sessionId, sessionId), eq(runtimeSession.status, "active")))
    .returning({ sessionId: runtimeSession.sessionId });
  if (!revoked) return false;

  await db.insert(auditLog).values(auditValues({
    environmentId: owned.environmentId,
    projectId: owned.projectId,
    workspaceId: owned.workspaceId,
    actorUserId: userId,
    accessTokenId: owned.accessTokenId ?? undefined,
    ip,
    action: "RUNTIME_SESSION_REVOKED",
  }));
  return true;
}

export async function expireHeartbeatTimeouts(onExpire: (sessionId: string) => void) {
  const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);
  const expired = await db
    .update(runtimeSession)
    .set({ status: "expired" })
    .where(and(eq(runtimeSession.status, "active"), lt(runtimeSession.lastHeartbeatAt, cutoff)))
    .returning({
      sessionId: runtimeSession.sessionId,
      environmentId: runtimeSession.environmentId,
      projectId: runtimeSession.projectId,
      workspaceId: runtimeSession.workspaceId,
      accessTokenId: runtimeSession.accessTokenId,
    });

  if (!expired.length) return;
  await db.insert(auditLog).values(expired.map((session) => auditValues({
    environmentId: session.environmentId,
    projectId: session.projectId,
    workspaceId: session.workspaceId,
    accessTokenId: session.accessTokenId ?? undefined,
    ip: "server",
    action: "RUNTIME_SESSION_HEARTBEAT_TIMEOUT",
  })));
  expired.forEach((session) => onExpire(session.sessionId));
}
