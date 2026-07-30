import express from "express";
import { secretsRouter } from "./routes/secrets.js";
import { tokensRouter } from "./routes/tokens.js";
import { auditRouter } from "./routes/audit.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/v1", secretsRouter);
app.use("/v1", tokensRouter);
app.use("/v1", auditRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`passway-api listening on http://localhost:${port}`);
});
