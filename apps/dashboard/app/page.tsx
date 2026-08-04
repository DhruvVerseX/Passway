import { redirect } from "next/navigation";

const landingUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000";

export default function HomePage() {
  redirect(landingUrl);
}