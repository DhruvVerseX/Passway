import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins/email-otp";
import { authSchema, db } from "../db/index.js";
import { getAllowedOrigins, getAuthEnv } from "../env.js";
import { sendResetPasswordEmail, sendVerificationCodeEmail } from "../email/resend.js";

const env = getAuthEnv();
const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  appName: "Passway",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  trustedOrigins: Array.from(getAllowedOrigins()),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    expiresIn: 10 * 60,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "email-verification") await sendVerificationCodeEmail(email, otp);
      },
      otpLength: 6,
      expiresIn: 10 * 60,
      storeOTP: "hashed",
      overrideDefaultEmailVerification: true,
    }),
  ],
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  advanced: {
    cookiePrefix: "passway",
    useSecureCookies: isProduction,
    crossSubDomainCookies: isProduction
      ? {
          enabled: true,
          domain: ".passway.co.in",
        }
      : undefined,
  },
});