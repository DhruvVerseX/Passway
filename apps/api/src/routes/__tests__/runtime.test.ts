import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRuntimeToken: vi.fn(),
  touchRuntimeToken: vi.fn(),
  verifyRuntimeSecretBundle: vi.fn(),
  getRuntimeSecretBundle: vi.fn(),
  recordAppHealth: vi.fn(),
  writeAudit: vi.fn(),
}));

vi.mock("../../services/runtime-token.service.js", () => ({
  authenticateRuntimeToken: mocks.authenticateRuntimeToken,
  touchRuntimeToken: mocks.touchRuntimeToken,
}));
vi.mock("../../services/runtime-secret.service.js", () => ({
  verifyRuntimeSecretBundle: mocks.verifyRuntimeSecretBundle,
  getRuntimeSecretBundle: mocks.getRuntimeSecretBundle,
}));
vi.mock("../../services/app-runtime.service.js", () => ({
  recordAppHealth: mocks.recordAppHealth,
}));
vi.mock("../../services/audit.service.js", () => ({
  writeAudit: mocks.writeAudit,
}));

const token = `ps_live_${"a".repeat(43)}`;

async function status() {
  const { runtimeRouter } = await import("../runtime.js");
  const app = express().use("/v1", runtimeRouter);
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    return await fetch(`http://127.0.0.1:${address.port}/v1/runtime/status`, {
      headers: { authorization: `Bearer ${token}`, "x-passway-app-id": "env-a" },
    });
  } finally {
    server.close();
  }
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("runtime status", () => {
  it("rejects disabled runtime even before a disabled timestamp exists", async () => {
    mocks.authenticateRuntimeToken.mockResolvedValue({
      id: "token-a",
      environmentId: "env-a",
      environmentName: "production",
      environmentStatus: "hosted",
      runtimeEnabled: false,
      runtimeDisabledAt: null,
      projectId: "project-a",
      workspaceId: "workspace-a",
    });

    await expect(status()).resolves.toMatchObject({ status: 423 });
    expect(mocks.verifyRuntimeSecretBundle).not.toHaveBeenCalled();
    expect(mocks.recordAppHealth).not.toHaveBeenCalled();
  });
});
