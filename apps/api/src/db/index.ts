import { drizzle } from "drizzle-orm/neon-serverless";
import { getAuthEnv } from "../env.js";
import * as authSchema from "./auth-schema.js";

export const db = drizzle({
  connection: getAuthEnv().DATABASE_URL,
  schema: authSchema,
});
export { authSchema };
