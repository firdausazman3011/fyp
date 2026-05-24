import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) redirect("/login");
  if (authUser.role !== "ADMIN") redirect("/home");

  return (
    <AppShell role="ADMIN" name={authUser.name} email={authUser.email} profilePicture={authUser.profilePicture}>
      {children}
    </AppShell>
  );
}
