import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntimeSession, fetchRuntimeStatus } from "../api.js";

const token = `ps_live_${"a".repeat(43)}`;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("runtime sessions API", () => {
  it("creates a scoped runtime session without logging the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          sessionId: "sess_a",
          sessionToken: `ps_live_${"b".repeat(43)}`,
          secrets: { DB_URL: "postgres://private" },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createRuntimeSession("https://api.passway.co.in", token, "environment-id", { challengeId: "dch_a", signature: "a".repeat(86) }),
    ).resolves.toMatchObject({
      kind: "success",
      session: { sessionId: "sess_a", secrets: { DB_URL: "postgres://private" } },
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.passway.co.in/api/runtime/sessions",
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      projectId: "environment-id", challengeId: "dch_a", signature: "a".repeat(86),
    });
  });
});

describe("runtime status API", () => {
  it("sends only the bearer token and never an environment selector", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          connected: true,
          environment: {
            id: "environment-id",
            name: "production",
            status: "hosted",
          },
          app: {
            id: "environment-id",
            name: "Backend",
            runtimeStatus: "hosted",
            lastConnectedAt: new Date().toISOString(),
          },
          secretCount: 2,
          delivery: "verified",
          health: "healthy",
          healthUrl: "https://app.passway.co.in/dashboard/environment-id",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchRuntimeStatus("https://api.passway.co.in", token, "environment-id"),
    ).resolves.toMatchObject({ kind: "success" });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.passway.co.in/v1/runtime/status",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: `Bearer ${token}`,
        "x-passway-app-id": "environment-id",
      },
    });
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("body");
  });

  it("normalizes token failures without exposing server details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(
      fetchRuntimeStatus("https://api.passway.co.in", token, "environment-id"),
    ).resolves.toEqual({ kind: "auth" });
  });

  it.each([
    [409, "not_hosted"],
    [423, "app_disabled"],
    [422, "unhealthy"],
    [429, "rate_limit"],
    [500, "server"],
  ] as const)("maps HTTP %s to %s", async (status, kind) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status })),
    );
    await expect(
      fetchRuntimeStatus("https://api.passway.co.in", token, "environment-id"),
    ).resolves.toEqual({ kind });
  });

  it("rejects responses that omit health metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ connected: true }))),
    );
    await expect(
      fetchRuntimeStatus("https://api.passway.co.in", token, "environment-id"),
    ).resolves.toEqual({ kind: "server" });
  });

  it("handles network failures without exposing the request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(
      fetchRuntimeStatus("https://api.passway.co.in", token, "environment-id"),
    ).resolves.toEqual({ kind: "network" });
  });

  it("stops waiting after the existing timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );

    const result = fetchRuntimeStatus(
      "https://api.passway.co.in",
      token,
      "environment-id",
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(result).resolves.toEqual({ kind: "timeout" });
  });
});
