import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Passway Docs",
  description: "Integrate runtime secret delivery",
};

const nav = [
  ["Introduction", "/docs"],
  ["Quickstart", "/docs/quickstart"],
  ["Node.js SDK", "/docs/sdk/node"],
  ["Next.js SDK", "/docs/sdk/nextjs"],
  ["Errors", "/docs/sdk/errors"],
  ["Security", "/docs/security"],
];

export default function DocsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
        <main>{children}</main>
    </div>
  );
}
