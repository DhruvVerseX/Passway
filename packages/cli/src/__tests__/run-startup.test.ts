import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ spawn: vi.fn(), fetchRuntimeSecrets: vi.fn(), runPasswordManager: vi.fn() }));

vi.mock("node:child_process", async (original) => ({ ...await original<typeof import("node:child_process")>(), spawn: mocks.spawn }));
vi.mock("../config.js", () => ({
  readProjectConfig: async () => ({ appId: "env_a", launchCommand: ["node", "server.js"] }),
  findRuntimeToken: async () => `ps_live_${"a".repeat(43)}`,
  hasValidLocalTokenFormat: () => true,
  apiBaseUrl: () => "https://api.passway.co.in",
}));
vi.mock("../device.js", () => ({ getOrCreateRuntimeDeviceKey: async () => ({}) }));
vi.mock("../api.js", () => ({
  fetchRuntimeStatus: async () => ({ kind: "success", status: {} }),
  createRuntimeDeviceProof: async () => ({ challengeId: "dch_a", signature: "proof" }),
  createRuntimeSession: async () => ({ kind: "success", session: { sessionId: "sess_a", sessionToken: "session", secretKeys: ["FIRST", "SECOND"] } }),
  fetchRuntimeSecrets: mocks.fetchRuntimeSecrets,
}));
vi.mock("../password-manager.js", () => ({
  runPasswordManager: mocks.runPasswordManager,
  printPasswordManagerHelp: vi.fn(),
}));

const oldArgv = process.argv;
const oldExitCode = process.exitCode;

afterEach(() => {
  process.argv = oldArgv;
  process.exitCode = oldExitCode;
  vi.resetModules();
  vi.restoreAllMocks();
  mocks.spawn.mockReset();
  mocks.fetchRuntimeSecrets.mockReset();
  mocks.runPasswordManager.mockReset();
});

describe("passway run startup", () => {
  it("never spawns the app after a partial secret fetch", async () => {
    process.argv = ["node", "passway", "run"];
    mocks.fetchRuntimeSecrets.mockResolvedValue(undefined);
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await import("../index.js");

    expect(process.exitCode).toBe(1);
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(write.mock.calls.flat().join("")).not.toContain("session");
  });

  it("uses the hosted runtime for bare passway inside a linked project", async () => {
    const cwd = process.cwd();
    const project = fs.mkdtempSync(path.join(os.tmpdir(), "passway-linked-"));
    fs.writeFileSync(path.join(project, ".passway.json"), "{}");
    try {
      process.chdir(project);
      process.argv = ["node", "passway"];
      mocks.fetchRuntimeSecrets.mockResolvedValue(undefined);
      vi.spyOn(process.stdout, "write").mockImplementation(() => true);

      await import("../index.js");

      expect(mocks.fetchRuntimeSecrets).toHaveBeenCalledOnce();
      expect(mocks.runPasswordManager).not.toHaveBeenCalled();
    } finally {
      process.chdir(cwd);
      fs.rmSync(project, { recursive: true, force: true });
    }
  });
});
