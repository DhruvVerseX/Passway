import type { NextFunction, Request, Response } from "express";
import { hashToken, looksLikePasswayToken } from "../crypto/tokens.js";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const attempts = new Map<string, { count: number; resetAt: number }>();

function allow(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}

declare global {
  namespace Express {
    interface Request {
      runtimeToken?: string;
    }
  }
}

export function requireRuntimeToken(req: Request, res: Response, next: NextFunction) {
  const [scheme, token, extra] = (req.header("authorization") ?? "").split(" ");
  // ponytail: per-process limiter; replace with Redis when running more than one API instance.
  if (!allow(`ip:${req.ip ?? "unknown"}`)) {
    return res.status(429).json({ error: "Too many requests" });
  }
  if (scheme !== "Bearer" || !token || extra || !looksLikePasswayToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const tokenHash = hashToken(token);
  if (!allow(`token:${tokenHash}`)) {
    return res.status(429).json({ error: "Too many requests" });
  }
  req.runtimeToken = token;
  next();
}
