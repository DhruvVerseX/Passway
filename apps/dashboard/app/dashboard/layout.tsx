import { requireSession } from "@/lib/session";

export default async function DashboardRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireSession("/dashboard");
  return children;
}
