import crypto from "node:crypto";
import { auditLog } from "../db/auth-schema.js";
import { db } from "../db/index.js";

export type AuditAction =
  | "SECRET_CREATED"
  | "SECRET_UPDATED"
  | "SECRET_DELETED"
  | "ENVIRONMENT_HOSTED"
  | "RUNTIME_TOKEN_CREATED"
  | "RUNTIME_TOKEN_USED"
  | "RUNTIME_TOKEN_REVOKED"
  | "RUNTIME_SECRET_BUNDLE_READ";

export interface AuditEvent {
  environmentId: string;
  projectId?: string;
  workspaceId?: string;
  actorUserId?: string;
  accessTokenId?: string;
  secretKey?: string;
  ip: string;
  action: AuditAction;
  result?: "allowed" | "denied";
  reason?: string;
}

export function auditValues(event: AuditEvent) {
  return {
    id: crypto.randomUUID(),
    environmentId: event.environmentId,
    projectId: event.projectId,
    workspaceId: event.workspaceId,
    actorUserId: event.actorUserId,
    accessTokenId: event.accessTokenId,
    secretKey: event.secretKey,
    ip: event.ip,
    action: event.action,
    result: event.result ?? "allowed",
    reason: event.reason,
  };
}

export async function writeAudit(event: AuditEvent) {
  await db.insert(auditLog).values(auditValues(event));
}
