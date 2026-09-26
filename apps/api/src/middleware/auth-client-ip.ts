import type { RequestHandler } from "express";

export const AUTH_CLIENT_IP_HEADER = "x-passway-client-ip";

// Express resolves req.ip from the socket unless a proxy is explicitly trusted.
// Always overwrite the header so clients cannot choose their rate-limit bucket.
export const authClientIp: RequestHandler = (req, _res, next) => {
  delete req.headers[AUTH_CLIENT_IP_HEADER];
  const ip = req.ip ?? req.socket.remoteAddress;
  if (ip) req.headers[AUTH_CLIENT_IP_HEADER] = ip;
  next();
};
