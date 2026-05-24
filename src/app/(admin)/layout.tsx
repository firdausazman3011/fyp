import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ClientShellProfile } from "@/components/layout/ClientShellProfile";
import { PageLoading } from "@/components/ui/page-loading";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="ADMIN" profileSlot={<ClientShellProfile role="ADMIN" />}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </AppShell>
  );
}
