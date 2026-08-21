import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession("/projects");
  return <AppShell user={session.user}>{children}</AppShell>;
}
