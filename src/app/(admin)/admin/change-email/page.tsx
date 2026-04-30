import { getCurrentAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangeEmailForm } from "@/components/profile/ChangeEmailForm";

export default async function AdminChangeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { email: true },
  });
  if (!user) return null;

  return (
    <ChangeEmailForm
      title="Admin Change Email"
      description="Rule enforced: admin email must end with @gmail.com and is only updated after email verification."
      currentEmail={user.email}
      status={params.status}
    />
  );
}
