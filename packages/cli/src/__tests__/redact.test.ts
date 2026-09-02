import { describe, expect, it } from "vitest";
import { redactKnownSecrets, secretValues } from "../redact.js";

describe("secret redaction", () => {
  it("redacts known secret values from strings and errors", () => {
    const secrets = secretValues({
      DATABASE_URL: "postgres://private",
      PUBLIC_NAME: "passway",
      API_KEY: "sk_private",
    });

    expect(redactKnownSecrets("failed for postgres://private", secrets)).toBe(
      "failed for [REDACTED]",
    );
    expect(
      redactKnownSecrets(new Error("bad sk_private"), secrets),
    ).not.toContain("sk_private");
    expect(redactKnownSecrets("hello passway", secrets)).toBe("hello [REDACTED]");
  });
});
