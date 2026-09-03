import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ select: vi.fn() }));

vi.mock("../../db/index.js", () => ({ db: { select: mocks.select } }));

import { listEnvironments } from "../environment.service.js";

const record = {
  id: "env-a",
  projectId: "project-a",
  name: "production",
  type: "production" as const,
  description: null,
  status: "hosted" as const,
  lockedAt: null,
  hostedAt: null,
  runtimeEnabled: true,
  runtimeHostedAt: null,
  runtimeDisabledAt: null,
  lastConnectedAt: null,
  lastHealthCheckAt: null,
  lastHealthHealthy: null,
  createdAt: new Date("2026-09-03T00:00:00Z"),
  updatedAt: new Date("2026-09-03T00:00:00Z"),
};

function countQuery(result: unknown[] | Error) {
  return {
    from: () => ({
      where: () => ({
        groupBy: () =>
          result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
      }),
    }),
  };
}

beforeEach(() => {
  mocks.select.mockReset();
  mocks.select
    .mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ projectId: "project-a", workspaceId: "workspace-a" }]),
          }),
        }),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([record]) }),
    })
    .mockReturnValueOnce(countQuery([]))
    .mockReturnValueOnce(countQuery([]));
});

describe("environment listing", () => {
  it("keeps listing environments before the runtime session migration runs", async () => {
    mocks.select.mockReturnValueOnce(
      countQuery(Object.assign(new Error("missing"), { cause: { code: "42P01" } })),
    );

    await expect(listEnvironments("project-a", "user-a")).resolves.toMatchObject([
      {
        id: "env-a",
        activeRuntimeSessions: 0,
        revocationLevel: "Static - no active live session",
      },
    ]);
  });
});
