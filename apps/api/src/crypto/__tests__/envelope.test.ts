import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SecretCryptoError } from "../errors.js";
import { decryptSecret, encryptSecret, rotateSecret } from "../envelope.js";

const savedEnvironment = {
  activeKeyVersion: process.env.PASSWAY_ACTIVE_KEY_VERSION,
  masterKeys: process.env.PASSWAY_MASTER_KEYS,
  masterKey: process.env.PASSWAY_MASTER_KEY,
};

function restoreEnvironment(name: keyof typeof savedEnvironment) {
  const value = savedEnvironment[name];
  const variable = {
    activeKeyVersion: "PASSWAY_ACTIVE_KEY_VERSION",
    masterKeys: "PASSWAY_MASTER_KEYS",
    masterKey: "PASSWAY_MASTER_KEY",
  }[name];
  if (value === undefined) delete process.env[variable];
  else process.env[variable] = value;
}

function changeLastCharacter(value: string) {
  const last = value.at(-1);
  return `${value.slice(0, -1)}${last === "A" ? "B" : "A"}`;
}

beforeEach(() => {
  process.env.PASSWAY_ACTIVE_KEY_VERSION = "v2";
  process.env.PASSWAY_MASTER_KEYS = JSON.stringify({
    v1: crypto.randomBytes(32).toString("base64"),
    v2: crypto.randomBytes(32).toString("base64"),
  });
  delete process.env.PASSWAY_MASTER_KEY;
});

afterEach(() => {
  restoreEnvironment("activeKeyVersion");
  restoreEnvironment("masterKeys");
  restoreEnvironment("masterKey");
});

describe("versioned secret envelope", () => {
  it("round-trips empty, Unicode, and maximum-size values", async () => {
    for (const value of ["", "passwort-\u79d8\u5bc6-\ud83d\udd10", "x".repeat(64 * 1024)]) {
      await expect(decryptSecret(await encryptSecret(value))).resolves.toBe(value);
    }
  });

  it("uses a unique nonce and ciphertext for each encryption", async () => {
    const [first, second] = await Promise.all([encryptSecret("same input"), encryptSecret("same input")]);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("fails completely when authenticated payload fields are modified", async () => {
    const encrypted = await encryptSecret("integrity protected");
    for (const field of ["ciphertext", "iv", "authTag", "wrappedDataKey"] as const) {
      const modified = { ...encrypted, [field]: changeLastCharacter(encrypted[field]) };
      await expect(decryptSecret(modified)).rejects.toBeInstanceOf(SecretCryptoError);
    }
  });

  it("rejects malformed and unsupported payloads", async () => {
    const encrypted = await encryptSecret("valid payload");
    await expect(decryptSecret({ ...encrypted, iv: "not%base64url" })).rejects.toBeInstanceOf(SecretCryptoError);
    await expect(decryptSecret({ ...encrypted, algorithm: "AES-CBC" as "AES-256-GCM" })).rejects.toBeInstanceOf(SecretCryptoError);
    await expect(decryptSecret({ ...encrypted, version: 2 as 1 })).rejects.toBeInstanceOf(SecretCryptoError);
  });

  it("rejects unknown and wrong key versions", async () => {
    const encrypted = await encryptSecret("key selection");
    await expect(decryptSecret({ ...encrypted, keyVersion: "v3" })).rejects.toBeInstanceOf(SecretCryptoError);
    await expect(decryptSecret({ ...encrypted, keyVersion: "v1" })).rejects.toBeInstanceOf(SecretCryptoError);
  });

  it("keeps old payloads decryptable and rotates them explicitly", async () => {
    const original = await encryptSecret("rotation compatible", "v1");
    await expect(decryptSecret(original)).resolves.toBe("rotation compatible");

    const rotated = await rotateSecret(original, "v2");
    expect(rotated.keyVersion).toBe("v2");
    await expect(decryptSecret(rotated)).resolves.toBe("rotation compatible");
  });

  it("does not fall back to an ephemeral key when key configuration is missing", async () => {
    delete process.env.PASSWAY_ACTIVE_KEY_VERSION;
    delete process.env.PASSWAY_MASTER_KEYS;
    delete process.env.PASSWAY_MASTER_KEY;
    await expect(encryptSecret("must not encrypt")).rejects.toMatchObject({ code: "KEY_UNAVAILABLE" });
  });
});
