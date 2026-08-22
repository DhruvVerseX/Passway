import { describe, expect, it } from "vitest";
import {
  EnvImportError,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_SECRETS,
  parseEnvContent,
} from "../env-import.js";

describe("parseEnvContent", () => {
  it("parses comments, quoted values, exports, and empty values", () => {
    expect(
      parseEnvContent(
        [
          "# database",
          "DATABASE_URL=postgres://localhost/app",
          'JWT_SECRET="quoted-value"',
          "EMPTY=",
          "export FEATURE_FLAG='enabled'",
        ].join("\n"),
      ),
    ).toEqual([
      { key: "DATABASE_URL", value: "postgres://localhost/app" },
      { key: "JWT_SECRET", value: "quoted-value" },
      { key: "EMPTY", value: "" },
      { key: "FEATURE_FLAG", value: "enabled" },
    ]);
  });

  it("rejects malformed keys", () => {
    expect(() => parseEnvContent("123_KEY=value")).toThrowError(
      new EnvImportError("INVALID_KEY", "123_KEY"),
    );
    expect(() => parseEnvContent("DATABASE URL=value")).toThrowError(
      EnvImportError,
    );
  });

  it("rejects duplicate keys before persistence", () => {
    expect(() => parseEnvContent("TOKEN=one\nTOKEN=two")).toThrowError(
      new EnvImportError("DUPLICATE_KEY", "TOKEN"),
    );
  });

  it("rejects oversized payloads", () => {
    expect(() =>
      parseEnvContent("KEY=" + "x".repeat(MAX_IMPORT_BYTES)),
    ).toThrowError(new EnvImportError("PAYLOAD_TOO_LARGE"));
  });

  it("rejects imports with too many secrets", () => {
    const content = Array.from(
      { length: MAX_IMPORT_SECRETS + 1 },
      (_, index) => `KEY_${index}=value`,
    ).join("\n");
    expect(() => parseEnvContent(content)).toThrowError(
      new EnvImportError("TOO_MANY_SECRETS"),
    );
  });
});
