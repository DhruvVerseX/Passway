import { afterEach, describe, expect, it, vi } from "vitest";
import { printConnectionFailure, printInvalidToken, printRunReady, printRuntimeIntro, printRuntimeProcessError, printRuntimeStep, printSetupSuccess } from "../output.js";

afterEach(() => vi.restoreAllMocks());

function captureOutput(print: () => void) {
  const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  print();
  return write.mock.calls.map(([value]) => String(value)).join("");
}

describe("safe CLI output", () => {
  const status = {
        connected: true,
        environment: { id: "env-1", name: "Production", status: "hosted" },
        app: { id: "env-1", name: "Backend", runtimeStatus: "hosted", lastConnectedAt: new Date().toISOString() },
        secretCount: 18,
        delivery: "verified",
        health: "healthy",
        healthUrl: "https://app.passway.co.in/dashboard/env-1",
  } as const;

  it("prints setup status without token or secret values", () => {
    const output = captureOutput(() => {
      printRuntimeIntro("START");
      printSetupSuccess(status, ["npm", "run", "dev"]);
    });

    expect(output).toContain("18 secrets available");
    expect(output).toContain("Backend vault linked");
    expect(output).toContain("RUNTIME CONNECTION");
    expect(output).toContain("Health         HEALTHY");
    expect(output).toContain("Runtime        HOSTED");
    expect(output).toContain("Next: passway run");
    expect(output).toContain("https://app.passway.co.in/dashboard/env-1");
    expect(output).not.toContain("ps_live_");
    expect(output).not.toContain("DATABASE_URL");
  });

  it("shows the run command without printing secret values", () => {
    const output = captureOutput(() => printRunReady(status, ["npm", "run", "dev"]));
    expect(output).toContain("18 secrets loaded for Backend");
    expect(output).toContain("Starting npm run dev");
    expect(output).not.toContain("DATABASE_URL");
  });

  it("keeps invalid-token and unhealthy failures generic", () => {
    const invalid = captureOutput(printInvalidToken);
    const unhealthy = captureOutput(() => printConnectionFailure({ kind: "unhealthy" }));

    expect(invalid).not.toContain("length");
    expect(invalid).not.toContain("ps_live_");
    expect(unhealthy).toContain("Your secrets were not exposed.");
  });

  it("redacts a fetched value from child startup errors", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    printRuntimeProcessError(new Error("failed with private-value"), ["private-value"]);
    expect(write.mock.calls.flat().join("")).not.toContain("private-value");
  });

  it("animates a runtime step and stops it on failure", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.useFakeTimers();
    try {
      printRuntimeStep("Checking hosted vault");
      await vi.advanceTimersByTimeAsync(240);
      expect(write.mock.calls.flat().join("")).toContain("·");
      printConnectionFailure({ kind: "network" });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
      if (descriptor) Object.defineProperty(process.stdout, "isTTY", descriptor);
      else Reflect.deleteProperty(process.stdout, "isTTY");
    }
  });
});
