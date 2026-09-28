import { describe, expect, it, vi } from "vitest";
import { cancel } from "@clack/prompts";
import { runPasswordManager } from "../password-manager.js";

vi.mock("@clack/prompts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@clack/prompts")>();
  return {
    ...actual,
    password: vi.fn(async () => "master"),
    select: vi.fn(async () => actual.CANCEL_SYMBOL),
    intro: vi.fn(),
    box: vi.fn(),
    cancel: vi.fn(),
  };
});
vi.mock("../vault.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../vault.js")>(),
  vaultExists: () => true,
  openVault: () => ({ name: "Personal", entries: [] }),
}));
vi.mock("../clipboard.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../clipboard.js")>(),
  clearClipboard: vi.fn(),
}));

describe("vault UI", () => {
  it("handles cancellation without an unhandled rejection", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
    try {
      await expect(runPasswordManager(undefined, [])).resolves.toBe(1);
      expect(cancel).toHaveBeenCalledWith("Cancelled");
    } finally {
      if (descriptor) Object.defineProperty(process.stdin, "isTTY", descriptor);
      else Reflect.deleteProperty(process.stdin, "isTTY");
    }
  });
});
