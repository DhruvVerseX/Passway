import { and, eq, gt, lt } from "drizzle-orm";
import { generateToken, hashToken, looksLikePasswayToken } from "../crypto/tokens.js";
import { accessToken, auditLog, environment, runtimeDevice, runtimeSession, user, workspace } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { sendRuntimeNewIpEmail } from "../email/resend.js";
import { auditValues } from "./audit.service.js";
import { getRuntimeSecretKeys } from "./runtime-secret.service.js";
import { authenticateRuntimeToken, touchRuntimeToken } from "./runtime-token.service.js";
import { consumeRuntimeDeviceSessionChallenge } from "./runtime-device.service.js";

export const RUNTIME_SESSION_TTL_MS = 15 * 60 * 1000;
export const HEARTBEAT_TIMEOUT_MS = 45_000;
const MAX_SESSIONS_PER_TOKEN = 3;

export class RuntimeSessionLimitError extends Error {}

export async function createRuntimeSession(
  projectId: string,
  tokenValue: string,
  ip: string,
  deviceProof: { challengeId: string; signature: string },
) {
  const device = await consumeRuntimeDeviceSessionChallenge(
    tokenValue,
    deviceProof.challengeId,
    deviceProof.signature,
  );
  const token = device?.token;
  if (!token || token.environmentStatus !== "hosted") return undefined;
  if (projectId !== token.environmentId && projectId !== token.projectId) return undefined;
  if (!token.runtimeEnabled) return undefined;

  const sessionId = `sess_${crypto.randomUUID()}`;
  const sessionToken = generateToken();
  const now = new Date();
  const secretKeys = await getRuntimeSecretKeys(token.environmentId);
  if (secretKeys.length === 0) return undefined;
  const [knownIp] = ip === "unknown" ? [true] : await db.select({ id: auditLog.id }).from(auditLog)
    .where(and(eq(auditLog.environmentId, token.environmentId), eq(auditLog.action, "RUNTIME_SESSION_CREATED"), eq(auditLog.ip, ip)))
    .limit(1);

  const inserted = await db.transaction(async (tx) => {
    const [currentToken] = await tx.select({ status: accessToken.status, revoked: accessToken.revoked, expiresAt: accessToken.expiresAt })
      .from(accessToken).where(eq(accessToken.id, token.id)).for("update");
    if (!currentToken || currentToken.status !== "active" || currentToken.revoked ||
      (currentToken.expiresAt && currentToken.expiresAt.getTime() <= Date.now())) return false;
    const active = await tx.select({ sessionId: runtimeSession.sessionId }).from(runtimeSession)
      .where(and(eq(runtimeSession.accessTokenId, token.id), eq(runtimeSession.status, "active"), gt(runtimeSession.expiresAt, now)))
      .limit(MAX_SESSIONS_PER_TOKEN);
    if (active.length >= MAX_SESSIONS_PER_TOKEN) throw new RuntimeSessionLimitError("Too many active sessions");
    await tx.insert(runtimeSession).values({
      sessionId,
      environmentId: token.environmentId,
      projectId: token.projectId,
      workspaceId: token.workspaceId,
      accessTokenId: token.id,
      deviceId: device.deviceId,
      sessionTokenHash: hashToken(sessionToken),
      status: "active",
      expiresAt: new Date(now.getTime() + RUNTIME_SESSION_TTL_MS),
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
    return true;
  });
  if (!inserted) return undefined;
  if (!knownIp && token.createdByUserId) {
    void db.select({ email: user.email }).from(user).where(eq(user.id, token.createdByUserId)).limit(1)
      .then(([owner]) => owner && sendRuntimeNewIpEmail(owner.email, token.environmentName, ip))
      .catch(() => undefined);
  }
  touchRuntimeToken(token.id);
  return { sessionId, sessionToken, secretKeys };
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
      tokenStatus: accessToken.status,
      tokenRevoked: accessToken.revoked,
      tokenExpiresAt: accessToken.expiresAt,
      deviceStatus: runtimeDevice.status,
      environmentStatus: environment.status,
      runtimeEnabled: environment.runtimeEnabled,
    })
    .from(runtimeSession)
    .innerJoin(accessToken, eq(runtimeSession.accessTokenId, accessToken.id))
    .innerJoin(runtimeDevice, eq(runtimeSession.deviceId, runtimeDevice.id))
    .innerJoin(environment, eq(runtimeSession.environmentId, environment.id))
    .where(and(
      eq(runtimeSession.sessionId, sessionId),
      eq(runtimeSession.sessionTokenHash, hashToken(sessionToken)),
    ))
    .limit(1);

  if (!session || session.status !== "active" || session.tokenStatus !== "active" ||
    session.tokenRevoked || (session.tokenExpiresAt && session.tokenExpiresAt.getTime() <= Date.now()) ||
    session.deviceStatus !== "active" || session.environmentStatus !== "hosted" || !session.runtimeEnabled) return undefined;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db
      .update(runtimeSession)
      .set({ status: "expired" })
      .where(and(eq(runtimeSession.sessionId, sessionId), eq(runtimeSession.status, "active")));
    return undefined;
  }
  return session;
}

export async function renewRuntimeSession(sessionId: string, sessionToken: string) {
  const session = await authenticateRuntimeSession(sessionId, sessionToken);
  if (!session) return false;

  const now = new Date();
  const [renewed] = await db
    .update(runtimeSession)
    .set({
      expiresAt: new Date(now.getTime() + RUNTIME_SESSION_TTL_MS),
      lastHeartbeatAt: now,
    })
    .where(and(
      eq(runtimeSession.sessionId, sessionId),
      eq(runtimeSession.status, "active"),
      gt(runtimeSession.expiresAt, now),
    ))
    .returning({ sessionId: runtimeSession.sessionId });
  return Boolean(renewed);
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
