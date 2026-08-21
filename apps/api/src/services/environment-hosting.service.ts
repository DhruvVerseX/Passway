import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { generateToken, hashToken } from "../crypto/tokens.js";
import { accessToken, auditLog, environment } from "../db/auth-schema.js";
import { db } from "../db/index.js";
import { auditValues } from "./audit.service.js";
import { getOwnedEnvironment } from "./environment-access.js";

export class EnvironmentHostingError extends Error {
  constructor(readonly code: "NOT_FOUND" | "ALREADY_HOSTED" | "NOT_ELIGIBLE") {
    super("Environment hosting failed");
    this.name = "EnvironmentHostingError";
  }
}

function tokenHint(token: string) {
  return `${token.slice(0, 16)}...`;
}

export async function hostEnvironment(environmentId: string, userId: string, ip: string) {
  const owned = await getOwnedEnvironment(environmentId, userId);
  if (!owned) throw new EnvironmentHostingError("NOT_FOUND");
  if (owned.status === "hosted") throw new EnvironmentHostingError("ALREADY_HOSTED");
  if (owned.status !== "draft") throw new EnvironmentHostingError("NOT_ELIGIBLE");

  const token = generateToken();
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const [hosted] = await tx
      .update(environment)
      .set({ status: "hosted", lockedAt: now, hostedAt: now, updatedAt: now })
      .where(and(eq(environment.id, environmentId), eq(environment.status, "draft")))
      .returning({ id: environment.id });
    if (!hosted) return undefined;

    const tokenId = crypto.randomUUID();
    await tx.insert(accessToken).values({
      id: tokenId,
      environmentId,
      tokenHash: hashToken(token),
      tokenHint: tokenHint(token),
      label: "Initial runtime token",
      status: "active",
      revoked: false,
      createdByUserId: userId,
      createdAt: now,
    });
    await tx.insert(auditLog).values([
      auditValues({
        environmentId,
        projectId: owned.projectId,
        workspaceId: owned.workspaceId,
        actorUserId: userId,
        accessTokenId: tokenId,
        ip,
        action: "ENVIRONMENT_HOSTED",
      }),
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

  if (!result) throw new EnvironmentHostingError("ALREADY_HOSTED");
  return { environmentId, status: "hosted" as const, token, createdAt: result.createdAt };
}
