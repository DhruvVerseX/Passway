import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const OLD_ENV = process.env;

describe("Resend delivery", () => {
  afterEach(() => {
    process.env = OLD_ENV;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("posts email payloads to Resend with mocked network calls", async () => {
    process.env = {
      ...OLD_ENV,
      DATABASE_URL: "postgresql://user:password@localhost:5432/passway",
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "http://localhost:3001",
      GOOGLE_CLIENT_ID: "google",
      GOOGLE_CLIENT_SECRET: "google-secret",
      GITHUB_CLIENT_ID: "github",
      GITHUB_CLIENT_SECRET: "github-secret",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "Passway <auth@passway.co.in>",
    };
    const { sendResendEmail } = await import("../resend");
    const calls: Parameters<typeof fetch>[] = [];
    const fetcher: typeof fetch = async (...args) => {
      calls.push(args);
      return new Response("{}", { status: 200 });
    };

    await sendResendEmail({ to: "user@example.com", subject: "Subject", html: "<p>Hello</p>", text: "Hello" }, fetcher);

    expect(calls).toHaveLength(1);
    const [url, init] = calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer resend-key" });
    expect(JSON.parse(String(init?.body))).toMatchObject({ to: "user@example.com", from: "Passway <auth@passway.co.in>" });
  });

  it("fails clearly when Resend is not configured", async () => {
    process.env = {
      ...OLD_ENV,
      DATABASE_URL: "postgresql://user:password@localhost:5432/passway",
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "http://localhost:3001",
      GOOGLE_CLIENT_ID: "google",
      GOOGLE_CLIENT_SECRET: "google-secret",
      GITHUB_CLIENT_ID: "github",
      GITHUB_CLIENT_SECRET: "github-secret",
      RESEND_API_KEY: "",
      RESEND_FROM_EMAIL: "Passway <auth@passway.co.in>",
    };
    const { sendResendEmail } = await import("../resend");

    await expect(sendResendEmail({ to: "user@example.com", subject: "Subject", html: "<p>Hello</p>", text: "Hello" })).rejects.toThrow("RESEND_API_KEY");
  });
});



