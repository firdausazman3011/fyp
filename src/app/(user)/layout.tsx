import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) redirect("/login");
  if (authUser.role !== "USER") redirect("/admin/dashboard");

  return (
    <AppShell role="USER" name={authUser.name} email={authUser.email} profilePicture={authUser.profilePicture}>
      {children}
    </AppShell>
  );
}
