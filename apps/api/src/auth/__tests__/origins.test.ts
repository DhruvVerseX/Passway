import { describe, expect, it } from "vitest";
import { getAllowedOrigins } from "../../env.js";

describe("API auth origin allowlist", () => {
  it("allows dashboard, web, and API origins", () => {
    const origins = getAllowedOrigins();
    expect(origins.has("http://localhost:3001")).toBe(true);
    expect(origins.has("http://localhost:3000")).toBe(true);
    expect(origins.has("http://127.0.0.1:3001")).toBe(true);
    expect(origins.has("http://127.0.0.1:3000")).toBe(true);
    expect(origins.has("https://app.passway.co.in")).toBe(true);
    expect(origins.has("https://api.passway.co.in")).toBe(true);
  });
});
