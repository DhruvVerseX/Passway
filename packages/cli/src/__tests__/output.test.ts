import { afterEach, describe, expect, it, vi } from "vitest";
import { printConnectionFailure, printInvalidToken, printSuccess } from "../output.js";

afterEach(() => vi.restoreAllMocks());

function captureOutput(print: () => void) {
  const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  print();
  return write.mock.calls.map(([value]) => String(value)).join("");
}

describe("safe CLI output", () => {
  it("prints healthy metadata without token or secret values", () => {
    const output = captureOutput(() =>
      printSuccess({
        connected: true,
        environment: { id: "env-1", name: "Production", status: "hosted" },
        app: { id: "env-1", name: "Backend", runtimeStatus: "hosted", lastConnectedAt: new Date().toISOString() },
        secretCount: 18,
        delivery: "verified",
        health: "healthy",
        healthUrl: "https://app.passway.co.in/dashboard/env-1",
      }),
    );

    expect(output).toContain("18 secrets available");
    expect(output).toContain("Backend Vault linked");
    expect(output).toContain("┌─ Runtime connection");
    expect(output).toContain("State        HEALTHY");
    expect(output).toContain("Runtime      HOSTED");
    expect(output).toContain("https://app.passway.co.in/dashboard/env-1");
    expect(output).not.toContain("ps_live_");
    expect(output).not.toContain("DATABASE_URL");
  });

  it("keeps invalid-token and unhealthy failures generic", () => {
    const invalid = captureOutput(printInvalidToken);
    const unhealthy = captureOutput(() => printConnectionFailure({ kind: "unhealthy" }));

    expect(invalid).not.toContain("length");
    expect(invalid).not.toContain("ps_live_");
    expect(unhealthy).toContain("Your secrets were not exposed.");
  });
});
