"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_PASSWAY_API_URL ?? "http://localhost:4000",
  plugins: [emailOTPClient()],
  fetchOptions: {
    credentials: "include",
  },
});