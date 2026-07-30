import type { Request } from "express";
import { store, newId, type TokenRecord } from "../store/db.js";

export function logAudit(
  req: Request,
  opts: {
    token: TokenRecord | undefined;
    project: string;
    environment: string;
    secretKey: string;
    result: "allowed" | "denied";
    reason?: string;
  }
) {
  store.writeAudit({
    id: newId(),
    timestamp: new Date().toISOString(),
    tokenId: opts.token?.id ?? null,
    tokenLabel: opts.token?.label ?? null,
    project: opts.project,
    environment: opts.environment,
    secretKey: opts.secretKey,
    ip: req.ip ?? "unknown",
    result: opts.result,
    reason: opts.reason,
  });
}
