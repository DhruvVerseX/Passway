import { VerifyEmailPanel } from "@/components/verify-email-panel";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ verified?: string; error?: string }> }) {
  const params = await searchParams;
  return <VerifyEmailPanel verified={params.verified === "1"} error={params.error} />;
}
