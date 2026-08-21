import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/auth.js";

declare global {
  namespace Express {
    interface Request {
      passwayUser?: { id: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    req.passwayUser = { id: session.user.id };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
