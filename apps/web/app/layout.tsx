import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passway EnvVault — Secrets delivery for developers",
  description: "Store secrets once, share a revokable token, and track every access.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
