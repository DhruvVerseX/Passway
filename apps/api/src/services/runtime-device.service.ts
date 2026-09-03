import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { auditLog, runtimeDevice, runtimeDeviceChallenge, runtimeSession } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import { authenticateRuntimeToken } from "./runtime-token.service.js";

const CHALLENGE_TTL_MS = 60_000;
const PUBLIC_KEY_PREFIX = "-----BEGIN PUBLIC KEY-----";

type TokenScope = Awaited<ReturnType<typeof authenticateRuntimeToken>>;
type RuntimeToken = NonNullable<TokenScope> & { createdByUserId: string };
type Purpose = "registration" | "session";

function validPublicKey(value: string) {
  if (value.length > 1024 || !value.startsWith(PUBLIC_KEY_PREFIX)) return false;
  try {
    return crypto.createPublicKey(value).asymmetricKeyType === "ed25519";
  } catch {
    return false;
  }
}

function validSignature(value: string) {
  return /^[A-Za-z0-9_-]{80,256}$/.test(value);
}

function canUseToken(token: TokenScope): token is RuntimeToken {
  return Boolean(token && token.createdByUserId && token.environmentStatus === "hosted" && token.runtimeEnabled);
}

async function issueChallenge(
  token: RuntimeToken,
  publicKey: string,
  purpose: Purpose,
  label?: string,
) {
  const challenge = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const id = `dch_${crypto.randomUUID()}`;
  await db.insert(runtimeDeviceChallenge).values({
    id,
    userId: token.createdByUserId,
    environmentId: token.environmentId,
    projectId: token.projectId,
    publicKey,
    label,
    purpose,
    challenge,
    expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
    createdAt: now,
  });
  return { challengeId: id, challenge };
}

export async function beginRuntimeDeviceRegistration(tokenValue: string, publicKey: string, label: string) {
  const token = await authenticateRuntimeToken(tokenValue);
  if (!canUseToken(token) || !validPublicKey(publicKey) || !label || label.length > 128) return undefined;
  return issueChallenge(token, publicKey, "registration", label);
}

export async function completeRuntimeDeviceRegistration(
  tokenValue: string,
  challengeId: string,
  signature: string,
) {
  const token = await authenticateRuntimeToken(tokenValue);
  if (!canUseToken(token) || !validSignature(signature)) return undefined;
  const result = await consumeChallenge(token, challengeId, signature, "registration");
  if (!result?.label) return undefined;

  const [existing] = await db
    .select({ id: runtimeDevice.id, userId: runtimeDevice.userId, environmentId: runtimeDevice.environmentId, projectId: runtimeDevice.projectId, status: runtimeDevice.status })
    .from(runtimeDevice)
    .where(eq(runtimeDevice.publicKey, result.publicKey))
    .limit(1);
  const now = new Date();
  if (existing && (
    existing.status !== "active" ||
    existing.userId !== token.createdByUserId ||
    existing.environmentId !== token.environmentId ||
    existing.projectId !== token.projectId
  )) return undefined;
  const deviceId = existing?.id ?? `dev_${crypto.randomUUID()}`;
  if (existing) {
    await db.update(runtimeDevice).set({ status: "active", label: result.label, revokedAt: null }).where(eq(runtimeDevice.id, deviceId));
  } else {
    await db.insert(runtimeDevice).values({
      id: deviceId,
      userId: token.createdByUserId,
      environmentId: token.environmentId,
      projectId: token.projectId,
      publicKey: result.publicKey,
      label: result.label,
      status: "active",
      createdAt: now,
    });
  }
  await db.insert(auditLog).values(auditValues({
    environmentId: token.environmentId,
    projectId: token.projectId,
    workspaceId: token.workspaceId,
    actorUserId: token.createdByUserId,
    accessTokenId: token.id,
    ip: "runtime",
    action: "RUNTIME_DEVICE_REGISTERED",
  }));
  return { deviceId };
}

export async function beginRuntimeDeviceChallenge(tokenValue: string, publicKey: string) {
  const token = await authenticateRuntimeToken(tokenValue);
  if (!canUseToken(token) || !validPublicKey(publicKey)) return undefined;
  const [device] = await db
    .select({ id: runtimeDevice.id })
    .from(runtimeDevice)
    .where(and(
      eq(runtimeDevice.publicKey, publicKey),
      eq(runtimeDevice.userId, token.createdByUserId),
      eq(runtimeDevice.environmentId, token.environmentId),
      eq(runtimeDevice.projectId, token.projectId),
      eq(runtimeDevice.status, "active"),
    ))
    .limit(1);
  if (!device) return undefined;
  return issueChallenge(token, publicKey, "session");
}

async function consumeChallenge(
  token: RuntimeToken,
  challengeId: string,
  signature: string,
  purpose: Purpose,
) {
  const [challenge] = await db
    .select()
    .from(runtimeDeviceChallenge)
    .where(and(
      eq(runtimeDeviceChallenge.id, challengeId),
      eq(runtimeDeviceChallenge.userId, token.createdByUserId),
      eq(runtimeDeviceChallenge.environmentId, token.environmentId),
      eq(runtimeDeviceChallenge.projectId, token.projectId),
      eq(runtimeDeviceChallenge.purpose, purpose),
      isNull(runtimeDeviceChallenge.usedAt),
      gt(runtimeDeviceChallenge.expiresAt, new Date()),
    ))
    .limit(1);
  if (!challenge) return undefined;

  const rawSignature = Buffer.from(signature, "base64url");
  const challengeValue = challengeSignatureInput(challenge.challenge, challengeId);
  if (!crypto.verify(null, challengeValue, challenge.publicKey, rawSignature)) return undefined;

  const [used] = await db
    .update(runtimeDeviceChallenge)
    .set({ usedAt: new Date() })
    .where(and(eq(runtimeDeviceChallenge.id, challengeId), isNull(runtimeDeviceChallenge.usedAt)))
    .returning({ id: runtimeDeviceChallenge.id });
  return used ? challenge : undefined;
}

export function challengeSignatureInput(challenge: string, challengeId: string) {
  return Buffer.from(`passway-device-v1:${challengeId}:${challenge}`);
}

export async function consumeRuntimeDeviceSessionChallenge(
  tokenValue: string,
  challengeId: string,
  signature: string,
) {
  const token = await authenticateRuntimeToken(tokenValue);
  if (!canUseToken(token) || !validSignature(signature)) return undefined;
  const challenge = await consumeChallenge(token, challengeId, signature, "session");
  if (!challenge) return undefined;
  const [device] = await db
    .select({ id: runtimeDevice.id })
    .from(runtimeDevice)
    .where(and(
      eq(runtimeDevice.publicKey, challenge.publicKey),
      eq(runtimeDevice.userId, token.createdByUserId),
      eq(runtimeDevice.environmentId, token.environmentId),
      eq(runtimeDevice.projectId, token.projectId),
      eq(runtimeDevice.status, "active"),
    ))
    .limit(1);
  if (!device) return undefined;
  await db.update(runtimeDevice).set({ lastUsedAt: new Date() }).where(eq(runtimeDevice.id, device.id));
  return { token, deviceId: device.id };
}

export async function listRuntimeDevices(environmentId: string, userId: string) {
  return db.select({
    id: runtimeDevice.id,
    label: runtimeDevice.label,
    status: runtimeDevice.status,
    createdAt: runtimeDevice.createdAt,
    lastUsedAt: runtimeDevice.lastUsedAt,
  }).from(runtimeDevice).where(and(eq(runtimeDevice.environmentId, environmentId), eq(runtimeDevice.userId, userId)));
}

export async function revokeRuntimeDevice(environmentId: string, deviceId: string, userId: string, ip: string) {
  const now = new Date();
  const [device] = await db.update(runtimeDevice).set({ status: "revoked", revokedAt: now })
    .where(and(eq(runtimeDevice.id, deviceId), eq(runtimeDevice.environmentId, environmentId), eq(runtimeDevice.userId, userId), eq(runtimeDevice.status, "active")))
    .returning({ projectId: runtimeDevice.projectId });
  if (!device) return undefined;
  const sessions = await db.update(runtimeSession).set({ status: "revoked" })
    .where(and(eq(runtimeSession.deviceId, deviceId), eq(runtimeSession.status, "active")))
    .returning({ sessionId: runtimeSession.sessionId });
  await db.insert(auditLog).values(auditValues({
    environmentId,
    projectId: device.projectId,
    actorUserId: userId,
    ip,
    action: "RUNTIME_DEVICE_REVOKED",
  }));
  return sessions.map((session) => session.sessionId);
}
