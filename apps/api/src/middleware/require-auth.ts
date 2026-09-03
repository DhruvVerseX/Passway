import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/auth.js";

declare global {
  namespace Express {
    interface Request {
      passwayUser?: { id: string; sessionCreatedAt?: Date };
    }
  }
}

const SECRET_WRITE_MAX_SESSION_AGE_MS = 15 * 60 * 1_000;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    req.passwayUser = {
      id: session.user.id,
      sessionCreatedAt: new Date(session.session.createdAt),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRecentAuth(req: Request, res: Response, next: NextFunction) {
  const createdAt = req.passwayUser?.sessionCreatedAt?.getTime();
  if (!createdAt || Date.now() - createdAt > SECRET_WRITE_MAX_SESSION_AGE_MS) {
    return res.status(401).json({
      error: "Re-authentication required before changing secrets",
    });
  }
  next();
}
