import type { NextFunction, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { hashToken, looksLikePasswayToken } from "../crypto/tokens.js";
import { rateLimit } from "../db/auth-schema.js";
import { db } from "../db/index.js";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
async function allow(key: string) {
  const now = Date.now();
  const id = `passway-runtime:${key}`;
  const [entry] = await db.insert(rateLimit).values({ id, key: id, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.id,
      set: {
        count: sql`CASE WHEN ${rateLimit.lastRequest} <= ${now - WINDOW_MS} THEN 1 ELSE ${rateLimit.count} + 1 END`,
        lastRequest: sql`CASE WHEN ${rateLimit.lastRequest} <= ${now - WINDOW_MS} THEN ${now} ELSE ${rateLimit.lastRequest} END`,
      },
    }).returning({ count: rateLimit.count });
  return entry.count <= MAX_REQUESTS;
}

declare global {
  namespace Express {
    interface Request {
      runtimeToken?: string;
    }
  }
}

export async function requireRuntimeToken(req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "no-store");
  const [scheme, token, extra] = (req.header("authorization") ?? "").split(" ");
  try {
    if (!await allow(`ip:${hashToken(req.ip ?? "unknown")}`)) {
      return res.status(429).json({ error: "Too many requests" });
    }
    if (scheme !== "Bearer" || !token || extra || !looksLikePasswayToken(token)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!await allow(`token:${hashToken(token)}`)) {
      return res.status(429).json({ error: "Too many requests" });
    }
    req.runtimeToken = token;
    next();
  } catch {
    return res.status(503).json({ error: "Runtime authorization unavailable" });
  }
}
