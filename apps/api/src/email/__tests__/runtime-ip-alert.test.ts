import { afterEach, expect, it, vi } from "vitest";
import { sendRuntimeNewIpEmail } from "../resend.js";

const previousEnv = process.env;

afterEach(() => { process.env = previousEnv; vi.unstubAllGlobals(); });

it("escapes the environment name in a new-IP alert", async () => {
  process.env = {
    ...previousEnv,
    DATABASE_URL: "postgresql://user:password@localhost:5432/passway",
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    BETTER_AUTH_URL: "http://localhost:4000",
    GOOGLE_CLIENT_ID: "google",
    GOOGLE_CLIENT_SECRET: "google-secret",
    GITHUB_CLIENT_ID: "github",
    GITHUB_CLIENT_SECRET: "github-secret",
    RESEND_API_KEY: "resend-key",
    RESEND_FROM_EMAIL: "Passway <auth@passway.co.in>",
  };
  const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetcher);

  await sendRuntimeNewIpEmail("owner@example.com", "<production>", "203.0.113.4");

  const body = JSON.parse(String(fetcher.mock.calls[0][1].body));
  expect(body.to).toBe("owner@example.com");
  expect(body.text).toContain("203.0.113.4");
  expect(body.html).toContain("&lt;production&gt;");
  expect(body.html).not.toContain("<production>");
});
