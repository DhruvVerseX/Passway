import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const TOKEN_PATTERN = /^ps_live_[A-Za-z0-9_-]{43}$/;

function cleanValue(value: string) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

async function tokenFromDotenv(cwd: string) {
  const dotenvPath = path.join(cwd, ".env");
  if (!fs.existsSync(dotenvPath)) return undefined;

  const input = fs.createReadStream(dotenvPath, { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    const match = line.match(/^\s*(?:export\s+)?PASSWAY_TOKEN\s*=\s*(.*)$/);
    if (match) return cleanValue(match[1]);
  }
  return undefined;
}

export async function findRuntimeToken(cwd = process.cwd()) {
  return process.env.PASSWAY_TOKEN?.trim() || tokenFromDotenv(cwd);
}

export async function findAppId(cwd = process.cwd()) {
  try {
    const config = JSON.parse(await fs.promises.readFile(path.join(cwd, ".passway.json"), "utf8")) as unknown;
    if (!config || typeof config !== "object" || Array.isArray(config)) return undefined;
    const appId = (config as Record<string, unknown>).appId;
    return typeof appId === "string" && appId.trim().length <= 128 ? appId.trim() || undefined : undefined;
  } catch {
    return undefined;
  }
}

export function hasValidLocalTokenFormat(token: string) {
  return TOKEN_PATTERN.test(token);
}

export function apiBaseUrl() {
  const local = fs.existsSync(path.join(process.cwd(), "apps/api/package.json"));
  return (process.env.PASSWAY_API_URL ?? (local ? "http://localhost:4000" : "https://api.passway.co.in")).replace(/\/$/, "");
}
