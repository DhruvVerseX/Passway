import { redirect } from "next/navigation";

const landingUrl =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3003";

export default function HomePage() {
  redirect(landingUrl);
}
