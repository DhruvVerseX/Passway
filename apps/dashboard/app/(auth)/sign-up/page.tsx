import { AuthForm } from "@/components/auth-form";
import { safeCallbackURL } from "@/lib/auth/redirects";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="sign-up" callbackURL={safeCallbackURL(params.callbackURL)} />;
}
