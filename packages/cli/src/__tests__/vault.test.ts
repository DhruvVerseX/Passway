import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  auditVault,
  createVault,
  generatePassword,
  nextCredentialId,
  openVault,
  passwordStrength,
  saveVault,
  VaultError,
} from "../vault.js";

let directory = "";
let originalPath: string | undefined;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "passway-vault-"));
  originalPath = process.env.PASSWAY_VAULT_PATH;
  process.env.PASSWAY_VAULT_PATH = path.join(directory, "vault.json");
});

afterEach(() => {
  if (originalPath === undefined) delete process.env.PASSWAY_VAULT_PATH;
  else process.env.PASSWAY_VAULT_PATH = originalPath;
  fs.rmSync(directory, { recursive: true, force: true });
});

describe("encrypted local vault", () => {
  it("round-trips credentials without storing plaintext", () => {
    const vault = createVault("correct horse battery staple");
    vault.entries.push({
      id: nextCredentialId(vault),
      name: "GitHub",
      username: "user@example.com",
      password: "secret-value-that-must-not-leak",
      website: "https://github.com",
      category: "Development",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveVault(vault, "correct horse battery staple");

    const stored = fs.readFileSync(process.env.PASSWAY_VAULT_PATH!, "utf8");
    expect(stored).not.toContain("GitHub");
    expect(stored).not.toContain("secret-value-that-must-not-leak");
    expect(openVault("correct horse battery staple")).toEqual(vault);
  });

  it("fails closed for the wrong master password", () => {
    createVault("correct horse battery staple");
    expect(() => openVault("wrong password")).toThrowError(new VaultError("INVALID_PASSWORD"));
  });
});

describe("password security helpers", () => {
  it("generates the requested length with every enabled character group", () => {
    for (let index = 0; index < 20; index += 1) {
      const password = generatePassword(20);
      expect(password).toHaveLength(20);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
      expect(passwordStrength(password)).toBe("Excellent");
    }
  });

  it("finds weak, reused, and old credentials without returning password values", () => {
    const old = new Date("2020-01-01").toISOString();
    const vault = {
      name: "Personal",
      entries: [
        { id: "pw_01", name: "One", username: "a", password: "short", website: "", category: "", createdAt: old, updatedAt: old },
        { id: "pw_02", name: "Two", username: "b", password: "short", website: "", category: "", createdAt: old, updatedAt: old },
      ],
    };
    const result = auditVault(vault);
    expect(result).toEqual({ weak: 2, reused: 2, old: 2 });
  });
});
