import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AUTH_CLIENT_IP_HEADER, authClientIp } from "../auth-client-ip.js";

describe("auth client IP", () => {
  it("overwrites client-supplied IP headers with the server-resolved address", () => {
    const req = {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      headers: {
        [AUTH_CLIENT_IP_HEADER]: "192.0.2.123",
        "x-forwarded-for": "192.0.2.123",
      },
    } as unknown as Request;
    const next = vi.fn();
    authClientIp(req, {} as Response, next as NextFunction);
    expect(req.headers[AUTH_CLIENT_IP_HEADER]).toBe("127.0.0.1");
    expect(next).toHaveBeenCalledOnce();
  });

  it("uses the socket address when req.ip is unavailable", () => {
    const req = { socket: { remoteAddress: "::1" }, headers: {} } as Request;
    authClientIp(req, {} as Response, vi.fn());
    expect(req.headers[AUTH_CLIENT_IP_HEADER]).toBe("::1");
  });
});
