import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ spawn: vi.fn(), fetchRuntimeSecrets: vi.fn() }));

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

const oldArgv = process.argv;
const oldExitCode = process.exitCode;

afterEach(() => {
  process.argv = oldArgv;
  process.exitCode = oldExitCode;
  vi.resetModules();
  vi.restoreAllMocks();
  mocks.spawn.mockReset();
  mocks.fetchRuntimeSecrets.mockReset();
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
});
