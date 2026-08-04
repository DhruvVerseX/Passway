"use client";

import { createAuthClient } from "better-auth/react";
import { apiBaseURL } from "./auth-ui";

export const authClient = createAuthClient({
  baseURL: apiBaseURL(),
  fetchOptions: {
    credentials: "include",
  },
});
