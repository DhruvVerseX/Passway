import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiBaseUrl, findRuntimeToken, hasValidLocalTokenFormat } from "../config.js";

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
