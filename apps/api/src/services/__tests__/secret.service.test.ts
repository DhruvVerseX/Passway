import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SecretRecord } from "../../store/db.js";

const { records } = vi.hoisted(() => ({ records: [] as SecretRecord[] }));

vi.mock("../../store/db.js", () => ({
  newId: () => crypto.randomUUID(),
  store: {
    putSecret(record: SecretRecord) {
      const index = records.findIndex(
        (item) => item.project === record.project && item.environment === record.environment && item.key === record.key
      );
      if (index >= 0) records[index] = record;
      else records.push(record);
    },
    getSecret(project: string, environment: string, key: string) {
      return records.find((item) => item.project === project && item.environment === environment && item.key === key);
    },
    listSecrets(project: string, environment: string) {
      return records.filter((item) => item.project === project && item.environment === environment);
    },
    deleteSecret(project: string, environment: string, key: string) {
      const index = records.findIndex((item) => item.project === project && item.environment === environment && item.key === key);
      if (index >= 0) records.splice(index, 1);
    },
  },
}));

const { secretService } = await import("../secret.service.js");

beforeEach(() => {
  records.length = 0;
  process.env.PASSWAY_ACTIVE_KEY_VERSION = "v1";
  process.env.PASSWAY_MASTER_KEYS = JSON.stringify({ v1: crypto.randomBytes(32).toString("base64") });
});

afterEach(() => {
  delete process.env.PASSWAY_ACTIVE_KEY_VERSION;
  delete process.env.PASSWAY_MASTER_KEYS;
});

describe("SecretService metadata boundary", () => {
  it("returns metadata only from create and list, decrypting only on explicit retrieval", async () => {
    const input = secretService.parseWriteInput({
      project: "api",
      environment: "development",
      key: "DATABASE_URL",
      value: "sensitive-value",
    });

    const created = await secretService.create(input);
    expect(created).not.toHaveProperty("value");
    expect(created).not.toHaveProperty("ciphertext");
    expect(created).not.toHaveProperty("wrappedDataKey");
    expect(secretService.list({ project: "api", environment: "development" })).toEqual([created]);

    await expect(secretService.getValue({ ...input })).resolves.toMatchObject({ value: "sensitive-value" });
  });
});
