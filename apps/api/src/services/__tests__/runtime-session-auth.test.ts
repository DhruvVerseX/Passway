import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ row: undefined as Record<string, unknown> | undefined, update: vi.fn() }));

vi.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from() { return this; },
      innerJoin() { return this; },
      where() { return this; },
      async limit() { return mocks.row ? [mocks.row] : []; },
    }),
    update: mocks.update,
  },
}));

import { authenticateRuntimeSession } from "../runtime-session.service.js";

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

afterEach(() => { mocks.row = undefined; mocks.update.mockReset(); });

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
});
