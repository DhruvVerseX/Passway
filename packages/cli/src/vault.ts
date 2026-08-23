import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type Credential = {
  id: string;
  name: string;
  username: string;
  password: string;
  website: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type Vault = { name: string; entries: Credential[] };

type Envelope = {
  version: 1;
  kdf: { name: "scrypt"; salt: string; cost: number };
  cipher: { name: "aes-256-gcm"; iv: string; tag: string; data: string };
};

const SCRYPT_COST = 32_768;
const SYMBOLS = "!@#$%^&*_-+=?";

export class VaultError extends Error {
  constructor(readonly code: "NOT_INITIALIZED" | "ALREADY_INITIALIZED" | "INVALID_PASSWORD" | "INVALID_FILE") {
    super("Passway vault operation failed");
    this.name = "VaultError";
  }
}

export function vaultPath() {
  return process.env.PASSWAY_VAULT_PATH ?? path.join(os.homedir(), ".passway", "vault.json");
}

export function vaultExists() {
  return fs.existsSync(vaultPath());
}

function deriveKey(password: string, salt: Buffer, cost: number) {
  return crypto.scryptSync(password, salt, 32, { N: cost, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

function isEnvelope(value: unknown): value is Envelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const kdf = item.kdf as Record<string, unknown> | undefined;
  const cipher = item.cipher as Record<string, unknown> | undefined;
  return item.version === 1 && kdf?.name === "scrypt" && kdf.cost === SCRYPT_COST &&
    typeof kdf.salt === "string" && cipher?.name === "aes-256-gcm" &&
    [cipher.iv, cipher.tag, cipher.data].every((field) => typeof field === "string");
}

function isVault(value: unknown): value is Vault {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === "string" && Array.isArray(item.entries) && item.entries.every((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const record = entry as Record<string, unknown>;
    return ["id", "name", "username", "password", "website", "category", "createdAt", "updatedAt"]
      .every((key) => typeof record[key] === "string");
  });
}

function readEnvelope(file = vaultPath()) {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!isEnvelope(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new VaultError("INVALID_FILE");
  }
}

function decrypt(envelope: Envelope, password: string) {
  const salt = Buffer.from(envelope.kdf.salt, "base64url");
  const key = deriveKey(password, salt, envelope.kdf.cost);
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.cipher.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(envelope.cipher.tag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.cipher.data, "base64url")),
      decipher.final(),
    ]);
    try {
      const parsed: unknown = JSON.parse(plaintext.toString("utf8"));
      if (!isVault(parsed)) throw new Error();
      return parsed;
    } finally {
      plaintext.fill(0);
    }
  } catch {
    throw new VaultError("INVALID_PASSWORD");
  } finally {
    key.fill(0);
    salt.fill(0);
  }
}

function encrypt(vault: Vault, password: string): Envelope {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(password, salt, SCRYPT_COST);
  const plaintext = Buffer.from(JSON.stringify(vault), "utf8");
  try {
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      version: 1,
      kdf: { name: "scrypt", salt: salt.toString("base64url"), cost: SCRYPT_COST },
      cipher: {
        name: "aes-256-gcm",
        iv: iv.toString("base64url"),
        tag: cipher.getAuthTag().toString("base64url"),
        data: data.toString("base64url"),
      },
    };
  } finally {
    key.fill(0);
    salt.fill(0);
    iv.fill(0);
    plaintext.fill(0);
  }
}

function writeEnvelope(envelope: Envelope) {
  const target = vaultPath();
  const directory = path.dirname(target);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(envelope)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, target);
}

export function createVault(password: string, name = "Personal") {
  if (vaultExists()) throw new VaultError("ALREADY_INITIALIZED");
  const vault: Vault = { name, entries: [] };
  writeEnvelope(encrypt(vault, password));
  return vault;
}

export function openVault(password: string, file = vaultPath()) {
  if (!fs.existsSync(file)) throw new VaultError("NOT_INITIALIZED");
  return decrypt(readEnvelope(file), password);
}

export function saveVault(vault: Vault, password: string) {
  writeEnvelope(encrypt(vault, password));
}

export function nextCredentialId(vault: Vault) {
  const highest = vault.entries.reduce((max, item) => Math.max(max, Number(item.id.match(/^pw_(\d+)$/)?.[1] ?? 0)), 0);
  return `pw_${String(highest + 1).padStart(2, "0")}`;
}

export function generatePassword(length = 20, options = { uppercase: true, lowercase: true, numbers: true, symbols: true }) {
  const groups = [
    options.uppercase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    options.lowercase ? "abcdefghijklmnopqrstuvwxyz" : "",
    options.numbers ? "0123456789" : "",
    options.symbols ? SYMBOLS : "",
  ].filter(Boolean);
  if (!groups.length || length < groups.length) throw new Error("Invalid password options");
  const chars = groups.map((group) => group[crypto.randomInt(group.length)]);
  const alphabet = groups.join("");
  while (chars.length < length) chars.push(alphabet[crypto.randomInt(alphabet.length)]);
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = crypto.randomInt(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join("");
}

export function passwordStrength(password: string) {
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  const score = Number(password.length >= 12) + Number(password.length >= 16) + Number(password.length >= 20) + Number(variety >= 3) + Number(variety === 4);
  return score >= 5 ? "Excellent" : score >= 4 ? "Strong" : score >= 3 ? "Fair" : "Weak";
}

export function auditVault(vault: Vault) {
  const reused = new Map<string, number>();
  for (const entry of vault.entries) reused.set(entry.password, (reused.get(entry.password) ?? 0) + 1);
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1_000;
  return {
    weak: vault.entries.filter((entry) => passwordStrength(entry.password) === "Weak").length,
    reused: vault.entries.filter((entry) => (reused.get(entry.password) ?? 0) > 1).length,
    old: vault.entries.filter((entry) => new Date(entry.updatedAt).getTime() < yearAgo).length,
  };
}

export function exportVault(destination: string) {
  if (!vaultExists()) throw new VaultError("NOT_INITIALIZED");
  fs.copyFileSync(vaultPath(), destination, fs.constants.COPYFILE_EXCL);
}

export function importVault(source: string, password: string) {
  const vault = openVault(password, source);
  writeEnvelope(readEnvelope(source));
  return vault;
}
