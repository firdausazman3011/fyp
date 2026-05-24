import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ClientShellProfile } from "@/components/layout/ClientShellProfile";
import { PageLoading } from "@/components/ui/page-loading";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="USER" profileSlot={<ClientShellProfile role="USER" />}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </AppShell>
  );
}
