import Link from "next/link";
import { signInURL } from "@/lib/auth-ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090d12] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-semibold">Passway dashboard</h1>
        <p className="mt-3 text-sm text-white/60">Manage your vaults and runtime access.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/dashboard" className="rounded-lg bg-[#b9f55d] px-4 py-2 text-sm font-semibold text-[#10130d]">Open dashboard</Link>
          <a href={signInURL("/dashboard")} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold">Sign in</a>
        </div>
      </div>
    </main>
  );
}
