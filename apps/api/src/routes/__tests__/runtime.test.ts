import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRuntimeToken: vi.fn(),
  touchRuntimeToken: vi.fn(),
  verifyRuntimeSecretBundle: vi.fn(),
  getRuntimeSecretBundle: vi.fn(),
  recordAppHealth: vi.fn(),
  writeAudit: vi.fn(),
  createRuntimeSession: vi.fn(),
  revokeRuntimeSession: vi.fn(),
  pushRuntimeSessionRevoke: vi.fn(),
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
vi.mock("../../services/runtime-session.service.js", () => ({
  createRuntimeSession: mocks.createRuntimeSession,
  revokeRuntimeSession: mocks.revokeRuntimeSession,
}));
vi.mock("../../runtime-websocket.js", () => ({
  pushRuntimeSessionRevoke: mocks.pushRuntimeSessionRevoke,
}));
vi.mock("../../middleware/require-auth.js", () => ({
  requireAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
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

async function createSession(body: unknown = { projectId: "env-a" }) {
  const { runtimeRouter } = await import("../runtime.js");
  const app = express().use(express.json()).use("/api", runtimeRouter);
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    return await fetch(`http://127.0.0.1:${address.port}/api/runtime/sessions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
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

describe("runtime sessions", () => {
  it("creates a session through the documented /api path", async () => {
    mocks.createRuntimeSession.mockResolvedValue({
      sessionId: "sess_a",
      sessionToken: `ps_live_${"b".repeat(43)}`,
      secrets: { DATABASE_URL: "postgres://private" },
    });

    const response = await createSession();

    await expect(response.json()).resolves.toMatchObject({
      sessionId: "sess_a",
      secrets: { DATABASE_URL: "postgres://private" },
    });
    expect(response.status).toBe(201);
    expect(mocks.createRuntimeSession).toHaveBeenCalledWith("env-a", token, expect.any(String));
  });
});
