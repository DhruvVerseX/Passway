"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { signInURL } from "@/lib/auth-ui";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(user?: User | null) {
  const source = user?.name || user?.email || "Passway User";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PU";
}

export function UserMenu({ user: initialUser, dropUp = false, direct = false }: { user?: User | null; dropUp?: boolean; direct?: boolean }) {
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user ?? initialUser;

  async function signOut() {
    await authClient.signOut();
    window.location.href = signInURL("/dashboard");
    router.refresh();
  }

  if (direct) {
    return (
      <button  className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent text-[10px] font-semibold">{initials(user)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-white/75">{user?.name || "Passway user"}</span>
          <span className="block truncate text-[10px] text-white/30">{user?.email || "Signed in"}</span>
        </span>
        <div className="flex items-center gap-2 p-2 cursor-pointer">
          <LogOut onClick={signOut} size={14} className="text-white/30 hover:text-red-400" />
        </div>
      </button>
    );
  }

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5">
        <span className="grid size-9 place-items-center rounded-full border border-[#1D2633] bg-[#05070A] text-xs font-semibold text-[#E6EDF3]">
          {initials(user)}
        </span>
        <span className="min-w-0 sm:block">
          <span className="block max-w-36 truncate text-xs font-medium text-[#E6EDF3]">{user?.name || "Passway user"}</span>
          <span className="block max-w-36 truncate text-[11px] text-[#8B949E]">{user?.email || "Signed in"}</span>
        </span>
      </summary>
      <div className={`absolute right-0 z-30 w-64 rounded-lg border border-[#1D2633] bg-[#0B0F14] p-3 shadow-2xl ${dropUp ? "bottom-full mb-2" : "mt-2"}`}>
        <p className="truncate text-sm font-semibold">{user?.name || "Passway user"}</p>
        <p className="mt-1 truncate text-xs text-[#8B949E]">{user?.email || "Signed in"}</p>
        <button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#1D2633] px-3 py-2 text-sm font-semibold text-[#E6EDF3] transition hover:bg-white/5">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </details>
  );
}