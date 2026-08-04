import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getAuthEnv } from "@/lib/env";
import * as schema from "./schema";

const sql = neon(getAuthEnv().DATABASE_URL);

export const db = drizzle(sql, { schema });
export { schema };
