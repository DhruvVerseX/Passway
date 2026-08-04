import "server-only";
import { z } from "zod";

const authEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

function isNextProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function getAuthEnv(): AuthEnv {
  const parsed = authEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "Passway <auth@passway.co.in>",
  });

  if (parsed.success) return parsed.data;

  if (isNextProductionBuild()) {
    return {
      DATABASE_URL: "postgresql://user:password@localhost:5432/passway",
      BETTER_AUTH_SECRET: "build-only-placeholder-secret-32-bytes",
      BETTER_AUTH_URL: "http://localhost:3001",
      GOOGLE_CLIENT_ID: "build-only",
      GOOGLE_CLIENT_SECRET: "build-only",
      GITHUB_CLIENT_ID: "build-only",
      GITHUB_CLIENT_SECRET: "build-only",
      RESEND_API_KEY: "build-only",
      RESEND_FROM_EMAIL: "Passway <auth@passway.co.in>",
    };
  }

  const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Missing or invalid Passway auth environment variables: ${missing}`);
}
