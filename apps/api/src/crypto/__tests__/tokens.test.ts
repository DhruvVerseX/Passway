import { describe, expect, it } from "vitest";
import { generateToken, hashToken, looksLikePasswayToken } from "../tokens.js";

describe("runtime tokens", () => {
  it("uses a 256-bit ps_live token format", () => {
    const token = generateToken();
    expect(token).toMatch(/^ps_live_[A-Za-z0-9_-]{43}$/);
    expect(looksLikePasswayToken(token)).toBe(true);
  });

  it("uses fresh randomness and stores a one-way SHA-256 hash", () => {
    const first = generateToken();
    const second = generateToken();
    const hash = hashToken(first);
    expect(first).not.toBe(second);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(first);
  });

  it("rejects malformed bearer values", () => {
    expect(looksLikePasswayToken("ps_live_short")).toBe(false);
    expect(looksLikePasswayToken("ps_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa extra")).toBe(false);
  });
});
