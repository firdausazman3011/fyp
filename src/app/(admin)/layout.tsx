import { redirect } from "next/navigation";
import { getCurrentAuthUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) redirect("/login");
  if (authUser.role !== "ADMIN") redirect("/home");

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { name: true, email: true, profilePicture: true },
  });
  if (!user) redirect("/login");

  return (
    <AppShell role="ADMIN" name={user.name} email={user.email} profilePicture={user.profilePicture}>
      {children}
    </AppShell>
  );
}
