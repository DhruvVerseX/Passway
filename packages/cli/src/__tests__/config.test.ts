import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  apiBaseUrl,
  detectLaunchCommand,
  findAppId,
  findRuntimeToken,
  hasValidLocalTokenFormat,
  readProjectConfig,
  saveProjectConfig,
} from "../config.js";

const token = `ps_live_${"a".repeat(43)}`;
let tempDir = "";
let originalToken: string | undefined;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "passway-cli-"));
  originalToken = process.env.PASSWAY_TOKEN;
  delete process.env.PASSWAY_TOKEN;
});

afterEach(() => {
  if (originalToken === undefined) delete process.env.PASSWAY_TOKEN;
  else process.env.PASSWAY_TOKEN = originalToken;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("runtime token discovery", () => {
  it("uses PASSWAY_TOKEN from the process environment when no file token exists", async () => {
    process.env.PASSWAY_TOKEN = token;
    await expect(findRuntimeToken(tempDir)).resolves.toBe(token);
  });

  it("reads only PASSWAY_TOKEN from a local .env", async () => {
    fs.writeFileSync(path.join(tempDir, ".env"), `DATABASE_URL=not-read\nPASSWAY_TOKEN=${token}\n`);
    await expect(findRuntimeToken(tempDir)).resolves.toBe(token);
  });

  it("gives the process environment priority over .env", async () => {
    process.env.PASSWAY_TOKEN = token;
    fs.writeFileSync(path.join(tempDir, ".env"), "PASSWAY_TOKEN=ps_live_short\n");
    await expect(findRuntimeToken(tempDir)).resolves.toBe(token);
  });

  it("can require the token to come from the local .env", async () => {
    process.env.PASSWAY_TOKEN = token;
    fs.writeFileSync(path.join(tempDir, ".env"), "PASSWAY_TOKEN=ps_live_short\n");
    await expect(findRuntimeToken(tempDir, { includeProcessEnv: false })).resolves.toBe("ps_live_short");
  });

  it("returns undefined when the current project has no token", async () => {
    await expect(findRuntimeToken(tempDir)).resolves.toBeUndefined();
  });

  it("fails local validation for malformed tokens", () => {
    expect(hasValidLocalTokenFormat(token)).toBe(true);
    expect(hasValidLocalTokenFormat("ps_live_short")).toBe(false);
  });

  it("uses the local API from the Passway workspace", () => {
    fs.mkdirSync(path.join(tempDir, "apps/api"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "apps/api/package.json"), "{}");
    const originalCwd = process.cwd();
    process.chdir(tempDir);
    try {
      expect(apiBaseUrl()).toBe("http://localhost:4000");
    } finally {
      process.chdir(originalCwd);
    }
  });
});

describe("App linking", () => {
  it("reads the App ID from the current project's .passway.json", async () => {
    fs.writeFileSync(path.join(tempDir, ".passway.json"), JSON.stringify({ appId: "app-123", launchCommand: ["npm", "run", "dev"] }));
    await expect(findAppId(tempDir)).resolves.toBe("app-123");
    await expect(readProjectConfig(tempDir)).resolves.toEqual({
      appId: "app-123",
      launchCommand: ["npm", "run", "dev"],
    });
  });

  it.each(["missing", "invalid JSON", "missing appId"])("rejects %s config", async (kind) => {
    if (kind === "invalid JSON") fs.writeFileSync(path.join(tempDir, ".passway.json"), "{");
    if (kind === "missing appId") fs.writeFileSync(path.join(tempDir, ".passway.json"), "{}");
    await expect(findAppId(tempDir)).resolves.toBeUndefined();
  });

  it("stores only the app id and launch command", async () => {
    await saveProjectConfig({ appId: "app-123", launchCommand: ["bun", "run", "dev"] }, tempDir);
    const saved = fs.readFileSync(path.join(tempDir, ".passway.json"), "utf8");

    expect(JSON.parse(saved)).toEqual({ appId: "app-123", launchCommand: ["bun", "run", "dev"] });
    expect(saved).not.toContain("PASSWAY_TOKEN");
    expect(saved).not.toContain(token);
  });
});

describe("launch command detection", () => {
  it("uses the detected package manager and existing dev script", async () => {
    fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({ scripts: { dev: "vite" } }));
    fs.writeFileSync(path.join(tempDir, "bun.lock"), "");

    await expect(detectLaunchCommand(tempDir)).resolves.toEqual(["bun", "run", "dev"]);
  });

  it("does not select recursive passway scripts", async () => {
    fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({ scripts: { dev: "passway run", start: "node server.js" } }));

    await expect(detectLaunchCommand(tempDir)).resolves.toEqual(["npm", "run", "start"]);
  });
});
