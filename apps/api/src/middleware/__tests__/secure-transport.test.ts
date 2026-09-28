import { describe, expect, it, vi } from "vitest";
import { secureTransport } from "../secure-transport.js";

describe("production API transport", () => {
  it("redirects HTTP to the configured HTTPS origin without trusting the request host", () => {
    const guard = secureTransport("https://api.passway.co.in");
    const redirect = vi.fn();
    guard({ secure: false, originalUrl: "/api/runtime/status?x=1", headers: { host: "evil.example" } } as never,
      { redirect } as never, vi.fn());
    expect(redirect).toHaveBeenCalledWith(308, "https://api.passway.co.in/api/runtime/status?x=1");
  });

  it("sets HSTS on HTTPS responses", () => {
    const set = vi.fn();
    const next = vi.fn();
    secureTransport("https://api.passway.co.in")({ secure: true } as never, { set } as never, next);
    expect(set).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    expect(next).toHaveBeenCalled();
  });

  it("rejects a plaintext public origin", () => {
    expect(() => secureTransport("http://api.passway.co.in")).toThrow("HTTPS");
  });
});
