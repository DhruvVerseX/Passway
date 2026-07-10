import type { NextFunction, Request, Response } from "express";

/**
 * Admin routes (issuing tokens, managing secrets, reading the audit log)
 * are a completely different trust level from the runtime fetch endpoint,
 * and deliberately use a separate check. For an MVP this is a single
 * shared admin key from the environment. Before real users show up,
 * replace this with proper session auth (e.g. NextAuth on the dashboard
 * side, issuing short-lived JWTs this API verifies) — a shared static
 * admin key does not scale past "it's just you."
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const provided = req.header("x-admin-key");
  const expected = process.env.PASSWAY_ADMIN_KEY;

  if (!expected) {
    return res.status(500).json({ error: "server_missing_admin_key_config" });
  }
  if (provided !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}
