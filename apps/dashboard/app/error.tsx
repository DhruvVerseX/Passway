"use client";

import { useRouter } from "next/navigation";

export default function DashboardError({ reset }: { reset: () => void }) {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0d0b] p-6 text-white">
      <section className="max-w-md rounded-2xl border border-white/10 bg-[#10130f] p-8">
        <h1 className="text-2xl font-semibold">Unable to load Passway</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          Passway could not load this page. The service may be temporarily
          unavailable. Try again shortly.
        </p>
        <button
          type="button"
          className="mt-6 rounded-lg bg-[#b9f55d] px-4 py-2 font-medium text-[#10130d]"
          onClick={() => {
            router.refresh();
            reset();
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
