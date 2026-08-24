import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const TOKEN_PATTERN = /^ps_live_[A-Za-z0-9_-]{43}$/;
const CONFIG_FILE = ".passway.json";

export interface ProjectConfig {
  appId: string;
  launchCommand?: string[];
}

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

export async function findRuntimeToken(
  cwd = process.cwd(),
  options: { includeProcessEnv?: boolean } = {},
) {
  return options.includeProcessEnv === false
    ? tokenFromDotenv(cwd)
    : process.env.PASSWAY_TOKEN?.trim() || tokenFromDotenv(cwd);
}

export async function readProjectConfig(cwd = process.cwd()) {
  try {
    const config = JSON.parse(await fs.promises.readFile(path.join(cwd, CONFIG_FILE), "utf8")) as unknown;
    if (!config || typeof config !== "object" || Array.isArray(config)) return undefined;
    const appId = (config as Record<string, unknown>).appId;
    if (typeof appId !== "string" || !appId.trim() || appId.trim().length > 128) return undefined;
    const launchCommand = (config as Record<string, unknown>).launchCommand;
    return {
      appId: appId.trim(),
      launchCommand:
        Array.isArray(launchCommand) &&
        launchCommand.length > 0 &&
        launchCommand.every((part) => typeof part === "string" && part.length > 0)
          ? launchCommand
          : undefined,
    };
  } catch {
    return undefined;
  }
}

export async function findAppId(cwd = process.cwd()) {
  return (await readProjectConfig(cwd))?.appId;
}

export async function saveProjectConfig(
  config: ProjectConfig,
  cwd = process.cwd(),
) {
  await fs.promises.writeFile(
    path.join(cwd, CONFIG_FILE),
    `${JSON.stringify(config, null, 2)}\n`,
    { mode: 0o600 },
  );
}

function packageManager(cwd: string) {
  if (fs.existsSync(path.join(cwd, "bun.lock")) || fs.existsSync(path.join(cwd, "bun.lockb"))) return "bun";
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

function safeScript(script: unknown) {
  return typeof script === "string" && !/\bpassway\s+(?:start|run)\b/.test(script);
}

export async function detectLaunchCommand(cwd = process.cwd()) {
  try {
    const manifest = JSON.parse(await fs.promises.readFile(path.join(cwd, "package.json"), "utf8")) as {
      scripts?: Record<string, unknown>;
    };
    const scripts = manifest.scripts ?? {};
    const scriptName = safeScript(scripts.dev) ? "dev" : safeScript(scripts.start) ? "start" : undefined;
    return scriptName ? [packageManager(cwd), "run", scriptName] : undefined;
  } catch {
    if (fs.existsSync(path.join(cwd, "server.js"))) return ["node", "server.js"];
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
