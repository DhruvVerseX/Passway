import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getAuthEnv } from "../env.js";
import * as authSchema from "./auth-schema.js";

const sql = neon(getAuthEnv().DATABASE_URL);

export const db = drizzle(sql, { schema: authSchema });
export { authSchema };
