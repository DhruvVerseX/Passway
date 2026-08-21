import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findRuntimeToken, hasValidLocalTokenFormat } from "../config.js";

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
  it("uses PASSWAY_TOKEN from the process environment", async () => {
    process.env.PASSWAY_TOKEN = token;
    fs.writeFileSync(path.join(tempDir, ".env"), `PASSWAY_TOKEN=ps_live_${"b".repeat(43)}\n`);
    await expect(findRuntimeToken(tempDir)).resolves.toBe(token);
  });

  it("reads only PASSWAY_TOKEN from a local .env", async () => {
    fs.writeFileSync(path.join(tempDir, ".env"), `DATABASE_URL=not-read\nPASSWAY_TOKEN=${token}\n`);
    await expect(findRuntimeToken(tempDir)).resolves.toBe(token);
  });

  it("fails local validation for malformed tokens", () => {
    expect(hasValidLocalTokenFormat(token)).toBe(true);
    expect(hasValidLocalTokenFormat("ps_live_short")).toBe(false);
  });
});
