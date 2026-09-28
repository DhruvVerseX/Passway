import type { RequestHandler } from "express";

export function secureTransport(publicOrigin: string): RequestHandler {
  if (!publicOrigin.startsWith("https://")) throw new Error("Production API origin must use HTTPS");
  return (req, res, next) => {
    if (!req.secure) return res.redirect(308, `${publicOrigin}${req.originalUrl}`);
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  };
}
