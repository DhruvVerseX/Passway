import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth.js";
import { getAllowedOrigins } from "./env.js";
import { secretsRouter } from "./routes/secrets.js";
import { environmentsRouter } from "./routes/environments.js";
import { resourcesRouter } from "./routes/resources.js";
import { runtimeRouter } from "./routes/runtime.js";

const app = express();
const allowedOrigins = getAllowedOrigins();

app.use((req, res, next) => {
  const origin = req.header("origin");
  const isRuntimeRequest = req.path.startsWith("/v1/runtime/");
  if (!isRuntimeRequest && origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      req.header("access-control-request-headers") ??
        "Content-Type, Authorization",
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
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
app.use("/v1", environmentsRouter);
app.use("/v1", resourcesRouter);
app.use("/v1", runtimeRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`passway-api listening on http://localhost:${port}`);
});
