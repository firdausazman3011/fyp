import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) redirect("/login");
  if (authUser.role !== "USER") redirect("/admin/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { name: true, email: true, profilePicture: true },
  });
  if (!user) redirect("/login");

  return (
    <AppShell role="USER" name={user.name} email={user.email} profilePicture={user.profilePicture}>
      {children}
    </AppShell>
  );
}
