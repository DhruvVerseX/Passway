import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth.js";
import { getAllowedOrigins } from "./env.js";
import { secretsRouter } from "./routes/secrets.js";
import { tokensRouter } from "./routes/tokens.js";
import { auditRouter } from "./routes/audit.js";

const app = express();
const allowedOrigins = getAllowedOrigins();

app.use((req, res, next) => {
  const origin = req.header("origin");
  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const authHandler = toNodeHandler(auth.handler);
app.all("/api/auth", authHandler);
app.all("/api/auth/*", authHandler);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/v1", secretsRouter);
app.use("/v1", tokensRouter);
app.use("/v1", auditRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`passway-api listening on http://localhost:${port}`);
});
