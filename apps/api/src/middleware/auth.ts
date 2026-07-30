import type { NextFunction, Request, Response } from "express";
import { hashToken } from "../crypto/tokens.js";
import { store, type TokenRecord } from "../store/db.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      passwayToken?: TokenRecord;
    }
  }
}

/**
 * This middleware is the whole trust boundary. Everything downstream
 * assumes req.passwayToken is a valid, unrevoked, unexpired token
 * scoped to a specific project + environment. Get this function right
 * and the rest of the app can be simple.
 */
export function requireToken(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing_bearer_token" });
  }

  const record = store.findTokenByHash(hashToken(token));

  if (!record) {
    return res.status(401).json({ error: "invalid_token" });
  }
  if (record.revoked) {
    return res.status(403).json({ error: "token_revoked" });
  }
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    return res.status(403).json({ error: "token_expired" });
  }

  req.passwayToken = record;
  next();
}
