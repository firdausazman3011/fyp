import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";
import { LandingPage } from "@/components/landing";

export default async function Home() {
  const user = await getCurrentAuthUser();

  // Redirect authenticated users to their respective dashboards
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/home");
  }

  // Show landing page for non-authenticated users
  return <LandingPage />;
}
