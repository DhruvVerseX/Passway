import Link from "next/link";
import { redirectAuthenticatedUsers } from "@/lib/session";

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await redirectAuthenticatedUsers();
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,.14),transparent_30rem)] px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/sign-in" className="mb-8 flex items-center justify-center">
          <img src="/assets/logo/passway-logo-dark.svg" alt="Passway" className="h-9 w-auto" />
        </Link>
        {children}
      </div>
    </main>
  );
}
