import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnedEnvironment: vi.fn(),
  verifyRuntimeSecretBundle: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  returning: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
}));

vi.mock("../../db/index.js", () => ({ db: { transaction: mocks.transaction, update: mocks.update } }));
vi.mock("../environment-access.js", () => ({ getOwnedEnvironment: mocks.getOwnedEnvironment }));
vi.mock("../runtime-secret.service.js", () => ({ verifyRuntimeSecretBundle: mocks.verifyRuntimeSecretBundle }));

import { AppRuntimeError, hostAppRuntime } from "../app-runtime.service.js";

const owned = {
  environmentId: "app-a",
  environmentName: "Backend",
  status: "hosted",
  runtimeEnabled: false,
  runtimeHostedAt: null,
  runtimeDisabledAt: null,
  lastConnectedAt: null,
  lastHealthCheckAt: null,
  lastHealthHealthy: null,
  projectId: "project-a",
  workspaceId: "workspace-a",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOwnedEnvironment.mockResolvedValue(owned);
  mocks.verifyRuntimeSecretBundle.mockResolvedValue(2);
  mocks.returning.mockResolvedValue([{ id: "app-a", name: "Backend", hostedAt: new Date("2026-08-23T12:00:00Z") }]);
  mocks.where.mockReturnValue({ returning: mocks.returning });
  mocks.set.mockReturnValue({ where: mocks.where });
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.values.mockResolvedValue(undefined);
  mocks.insert.mockReturnValue({ values: mocks.values });
  mocks.transaction.mockImplementation(async (run) => run({ update: mocks.update, insert: mocks.insert }));
});

describe("App runtime hosting", () => {
  it("lets the owner host a configured App and returns metadata only", async () => {
    const result = await hostAppRuntime("app-a", "owner-a", "127.0.0.1");

    expect(result).toMatchObject({ id: "app-a", name: "Backend", runtimeStatus: "hosted", secretCount: 2 });
    expect(result).not.toHaveProperty("secrets");
    expect(result).not.toHaveProperty("token");
    expect(mocks.set.mock.calls[0][0]).not.toHaveProperty("lastHealthHealthy");
    expect(mocks.values.mock.calls[0][0].secretKey).toBeUndefined();
    expect(mocks.values.mock.calls[0][0].accessTokenId).toBeUndefined();
  });

  it("does not reveal whether an App exists to an unauthorized user", async () => {
    mocks.getOwnedEnvironment.mockResolvedValue(undefined);
    await expect(hostAppRuntime("app-a", "other-user", "127.0.0.1")).rejects.toEqual(new AppRuntimeError("NOT_FOUND"));
  });

  it("requires a hosted Environment", async () => {
    mocks.getOwnedEnvironment.mockResolvedValue({ ...owned, status: "draft" });
    await expect(hostAppRuntime("app-a", "owner-a", "127.0.0.1")).rejects.toEqual(new AppRuntimeError("ENVIRONMENT_NOT_HOSTED"));
  });

  it("requires at least one decryptable secret", async () => {
    mocks.verifyRuntimeSecretBundle.mockResolvedValueOnce(0).mockRejectedValueOnce(new Error("corrupt"));
    await expect(hostAppRuntime("app-a", "owner-a", "127.0.0.1")).rejects.toEqual(new AppRuntimeError("INVALID_CONFIG"));
    await expect(hostAppRuntime("app-a", "owner-a", "127.0.0.1")).rejects.toEqual(new AppRuntimeError("INVALID_CONFIG"));
  });
});
