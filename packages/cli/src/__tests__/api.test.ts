import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRuntimeStatus } from "../api.js";

const token = `ps_live_${"a".repeat(43)}`;

afterEach(() => vi.unstubAllGlobals());

describe("runtime status API", () => {
  it("sends only the bearer token and never an environment selector", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          connected: true,
          environment: { name: "production", status: "hosted" },
          secretCount: 2,
          delivery: "verified",
          dashboardUrl: "https://app.passway.co.in/projects/project-id",
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchRuntimeStatus("https://api.passway.co.in", token)).resolves.toMatchObject({ kind: "success" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.passway.co.in/v1/runtime/status");
  });

  it("normalizes token failures without exposing server details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(fetchRuntimeStatus("https://api.passway.co.in", token)).resolves.toEqual({ kind: "auth" });
  });
});
