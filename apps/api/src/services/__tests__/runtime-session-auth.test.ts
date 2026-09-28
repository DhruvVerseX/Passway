import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ row: undefined as Record<string, unknown> | undefined, update: vi.fn(), transaction: vi.fn(), consumeChallenge: vi.fn() }));

vi.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from() { return this; },
      innerJoin() { return this; },
      where() { return this; },
      async limit() { return mocks.row ? [mocks.row] : []; },
    }),
    update: mocks.update,
    transaction: mocks.transaction,
  },
}));

vi.mock("../runtime-device.service.js", () => ({ consumeRuntimeDeviceSessionChallenge: mocks.consumeChallenge }));
vi.mock("../runtime-secret.service.js", () => ({ getRuntimeSecretKeys: async () => ["DB_URL"] }));
vi.mock("../runtime-token.service.js", () => ({ touchRuntimeToken: vi.fn() }));

import { authenticateRuntimeSession, createRuntimeSession, RuntimeSessionLimitError } from "../runtime-session.service.js";

const sessionToken = `ps_live_${"a".repeat(43)}`;
const active = () => ({
  sessionId: "sess_a",
  environmentId: "env_a",
  status: "active",
  expiresAt: new Date(Date.now() + 60_000),
  tokenStatus: "active",
  tokenRevoked: false,
  tokenExpiresAt: new Date(Date.now() + 60_000),
  deviceStatus: "active",
  environmentStatus: "hosted",
  runtimeEnabled: true,
});

afterEach(() => { mocks.row = undefined; mocks.update.mockReset(); mocks.transaction.mockReset(); mocks.consumeChallenge.mockReset(); });

describe("runtime session authorization", () => {
  it("accepts an active session", async () => {
    mocks.row = active();
    await expect(authenticateRuntimeSession("sess_a", sessionToken)).resolves.toMatchObject({ environmentId: "env_a" });
  });

  it.each([
    ["revoked session", { status: "revoked" }],
    ["revoked access token", { tokenRevoked: true }],
    ["expired access token", { tokenExpiresAt: new Date(Date.now() - 1_000) }],
    ["revoked device", { deviceStatus: "revoked" }],
    ["disabled runtime", { runtimeEnabled: false }],
  ])("rejects a %s", async (_name, change) => {
    mocks.row = { ...active(), ...change };
    await expect(authenticateRuntimeSession("sess_a", sessionToken)).resolves.toBeUndefined();
  });

  it("rejects an unknown session token", async () => {
    await expect(authenticateRuntimeSession("sess_a", sessionToken)).resolves.toBeUndefined();
  });

  it("expires a timed-out session", async () => {
    mocks.row = { ...active(), expiresAt: new Date(Date.now() - 1_000) };
    mocks.update.mockReturnValue({ set: () => ({ where: async () => undefined }) });
    await expect(authenticateRuntimeSession("sess_a", sessionToken)).resolves.toBeUndefined();
    expect(mocks.update).toHaveBeenCalled();
  });

  it("rejects a fourth concurrent session for one token", async () => {
    mocks.consumeChallenge.mockResolvedValue({
      deviceId: "dev_a",
      token: { id: "tok_a", environmentId: "env_a", projectId: "project_a", workspaceId: "workspace_a", environmentStatus: "hosted", runtimeEnabled: true, createdByUserId: "user_a" },
    });
    mocks.transaction.mockImplementation(async (work) => {
      let selects = 0;
      const tx = {
        select: () => {
          selects += 1;
          return {
            from() { return this; }, where() { return this; },
            for() { return [{ status: "active", revoked: false, expiresAt: new Date(Date.now() + 60_000) }]; },
            limit() { return Array.from({ length: 3 }, (_, i) => ({ sessionId: `sess_${i}` })); },
          };
        },
      };
      await work(tx);
      expect(selects).toBe(2);
    });
    await expect(createRuntimeSession("env_a", sessionToken, "127.0.0.1", { challengeId: "dch_a", signature: "proof" }))
      .rejects.toBeInstanceOf(RuntimeSessionLimitError);
  });
});
