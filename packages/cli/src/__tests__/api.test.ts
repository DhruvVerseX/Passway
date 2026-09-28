import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntimeSession, fetchRuntimeSecret, fetchRuntimeSecrets, fetchRuntimeStatus } from "../api.js";

const token = `ps_live_${"a".repeat(43)}`;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("runtime sessions API", () => {
  it("keeps a canary value and both tokens out of request URLs and CLI logs", async () => {
    const canary = "CANARY_abc123";
    const session = { sessionId: "sess_a", sessionToken: `ps_live_${"b".repeat(43)}`, secretKeys: ["DB_URL"] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ value: canary })));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(fetchRuntimeSecret("https://api.passway.co.in", session, "DB_URL")).resolves.toBe(canary);
      const url = String(fetchMock.mock.calls[0][0]);
      expect(url).not.toContain(canary);
      expect(url).not.toContain(token);
      expect(url).not.toContain(session.sessionToken);
      expect(fetchMock.mock.calls[0][1].headers.authorization).toBe(`Bearer ${session.sessionToken}`);
      expect(JSON.stringify([log.mock.calls, warn.mock.calls, error.mock.calls])).not.toContain(canary);
    } finally {
      log.mockRestore(); warn.mockRestore(); error.mockRestore();
    }
  });

  it("creates a scoped runtime session without logging the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          sessionId: "sess_a",
          sessionToken: `ps_live_${"b".repeat(43)}`,
          secretKeys: ["DB_URL"],
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createRuntimeSession("https://api.passway.co.in", token, "environment-id", { challengeId: "dch_a", signature: "a".repeat(86) }),
    ).resolves.toMatchObject({
      kind: "success",
      session: { sessionId: "sess_a", secretKeys: ["DB_URL"] },
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.passway.co.in/api/runtime/sessions",
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      projectId: "environment-id", challengeId: "dch_a", signature: "a".repeat(86),
    });
  });

  it("fetches one value with the session token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ value: "postgres://private" })));
    vi.stubGlobal("fetch", fetchMock);
    const session = { sessionId: "sess_a", sessionToken: `ps_live_${"b".repeat(43)}`, secretKeys: ["DB_URL"] };
    await expect(fetchRuntimeSecret("https://api.passway.co.in", session, "DB_URL")).resolves.toBe("postgres://private");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.passway.co.in/api/runtime/sessions/sess_a/secrets/DB_URL");
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe(`Bearer ${session.sessionToken}`);
    expect(fetchMock.mock.calls[0][1].headers.authorization).not.toContain(token);
  });

  it("does not treat a failed fetch as an empty secret", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(fetchRuntimeSecret("https://api.passway.co.in", { sessionId: "sess_a", sessionToken: token, secretKeys: ["DB_URL"] }, "DB_URL")).resolves.toBeUndefined();
  });

  it("rejects a session with no secret names", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      sessionId: "sess_a", sessionToken: token, secretKeys: [],
    }), { status: 201 })));
    await expect(createRuntimeSession("https://api.passway.co.in", token, "env_a", { challengeId: "dch_a", signature: "a".repeat(86) }))
      .resolves.toEqual({ kind: "server" });
  });

  it("discards partial values when a later fetch fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: "private" })))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchRuntimeSecrets("https://api.passway.co.in", {
      sessionId: "sess_a", sessionToken: token, secretKeys: ["FIRST", "SECOND"],
    })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
