import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { EncryptedSecret } from "../crypto/envelope.js";

export interface SecretRecord extends EncryptedSecret {
  id: string;
  project: string;
  environment: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenRecord {
  id: string;
  tokenHash: string;
  label: string;
  project: string;
  environment: string;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
  lastUsedAt: string | null;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  tokenId: string | null;
  tokenLabel: string | null;
  project: string;
  environment: string;
  secretKey: string;
  ip: string;
  result: "allowed" | "denied";
  reason?: string;
}

interface DbShape {
  secrets: SecretRecord[];
  tokens: TokenRecord[];
  audit: AuditRecord[];
}

/**
 * A flat JSON file is fine for a local/dev deployment and for getting
 * the architecture right end-to-end. It is NOT what you ship to real
 * users: swap this module for Postgres (Prisma or plain `pg`) before
 * you have more than one developer relying on it, since this has no
 * transactions, no concurrent-write safety, and no backups.
 */
const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureDb(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const empty: DbShape = { secrets: [], tokens: [], audit: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as DbShape;
}

let db: DbShape = ensureDb();

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function newId(): string {
  return crypto.randomUUID();
}

export const store = {
  // --- secrets ---
  putSecret(rec: SecretRecord) {
    const idx = db.secrets.findIndex(
      (s) =>
        s.project === rec.project &&
        s.environment === rec.environment &&
        s.key === rec.key
    );
    if (idx >= 0) db.secrets[idx] = rec;
    else db.secrets.push(rec);
    persist();
  },
  getSecret(project: string, environment: string, key: string) {
    return db.secrets.find(
      (s) => s.project === project && s.environment === environment && s.key === key
    );
  },
  listSecrets(project: string, environment: string) {
    return db.secrets.filter(
      (s) => s.project === project && s.environment === environment
    );
  },
  deleteSecret(project: string, environment: string, key: string) {
    db.secrets = db.secrets.filter(
      (s) =>
        !(s.project === project && s.environment === environment && s.key === key)
    );
    persist();
  },

  // --- tokens ---
  createToken(rec: TokenRecord) {
    db.tokens.push(rec);
    persist();
  },
  findTokenByHash(tokenHash: string) {
    return db.tokens.find((t) => t.tokenHash === tokenHash);
  },
  listTokens() {
    return db.tokens;
  },
  revokeToken(id: string) {
    const t = db.tokens.find((t) => t.id === id);
    if (t) {
      t.revoked = true;
      persist();
    }
    return t;
  },
  touchTokenLastUsed(id: string) {
    const t = db.tokens.find((t) => t.id === id);
    if (t) {
      t.lastUsedAt = new Date().toISOString();
      persist();
    }
  },

  // --- audit ---
  writeAudit(rec: AuditRecord) {
    db.audit.push(rec);
    persist();
  },
  listAudit(limit = 100) {
    return db.audit.slice(-limit).reverse();
  },
};
