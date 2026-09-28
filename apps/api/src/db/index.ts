import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import WebSocket from "ws";
import { getAuthEnv } from "../env.js";
import * as authSchema from "./auth-schema.js";

// Use the Node transport explicitly instead of the runtime's global WebSocket.
// Keep the serverless Pool so interactive transactions continue to work.
neonConfig.webSocketConstructor = WebSocket;
const pool = new Pool({
  connectionString: getAuthEnv().DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});
pool.on("error", () => {
  // Do not log driver errors: they can contain query parameters and OAuth state.
  console.error("Passway database connection failed; check Neon connectivity.");
});

export const db = drizzle({ client: pool, schema: authSchema });
export const closeDatabase = () => pool.end();
export { authSchema };
