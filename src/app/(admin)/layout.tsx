import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ClientShellProfile } from "@/components/layout/ClientShellProfile";
import { PageLoading } from "@/components/ui/page-loading";
import { getCurrentAuthUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getCurrentAuthUser();

  return (
    <AppShell role="ADMIN" profileSlot={<ClientShellProfile role="ADMIN" initialUser={authUser} />}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </AppShell>
  );
}
