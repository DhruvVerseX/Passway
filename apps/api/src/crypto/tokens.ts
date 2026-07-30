import crypto from "node:crypto";

const PREFIX = "psw_live";

/**
 * Generates a bearer token in the form psw_live_<43 base64url chars>,
 * which is 256 bits of randomness — well above the 128-bit floor for
 * a bearer credential. The prefix is deliberate: it lets secret
 * scanners (GitHub, GitGuardian, etc.) recognize a leaked Passway
 * token by pattern, and lets you grep logs without ambiguity.
 */
export function generateToken(): string {
  const random = crypto.randomBytes(32).toString("base64url");
  return `${PREFIX}_${random}`;
}

/**
 * We only ever store this hash, never the raw token — the same
 * principle as password storage. If the database leaks, the tokens
 * inside it are not directly usable.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function looksLikePasswayToken(value: string): boolean {
  return value.startsWith(`${PREFIX}_`);
}
