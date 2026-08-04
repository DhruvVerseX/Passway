import { AuthForm } from "@/components/auth-form";
import { safeCallbackURL } from "@/lib/auth/redirects";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="sign-in" callbackURL={safeCallbackURL(params.callbackURL)} />;
}
