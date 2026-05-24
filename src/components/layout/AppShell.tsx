"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  role: "USER" | "ADMIN";
  profileSlot: ReactNode;
  children: ReactNode;
};

const userNav = [
  { href: "/home", label: "Home" },
  { href: "/activities", label: "Community Activities" },
  { href: "/suggestions", label: "Activity Suggestion" },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/activities", label: "Manage Activities" },
  { href: "/admin/suggestions", label: "Review Suggestions" },
];

export function AppShell({ role, profileSlot, children }: AppShellProps) {
  const pathname = usePathname();
  const navItems = role === "ADMIN" ? adminNav : userNav;
  const logoHref = role === "ADMIN" ? "/admin/dashboard" : "/home";
  const supportEmail = "uniconnect12345@gmail.com";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function navLinkClass(href: string) {
    const active = pathname === href;
    return cn(
      "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href={logoHref} className="text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80">
            UniConnect
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileNavOpen((current) => !current)}
            >
              Menu
            </Button>
            {profileSlot}
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 top-14 z-20 bg-black/50 backdrop-blur-sm sm:top-16 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                  {item.label}
                </Link>
              ))}
            </nav>
            {role === "USER" ? (
              <div className="mt-auto border-t border-sidebar-border pt-4">
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent/80"
                >
                  Help Center
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      <aside className="fixed left-0 top-14 z-10 hidden h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sm:top-16 sm:h-[calc(100vh-4rem)] md:flex">
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
        {role === "USER" ? (
          <div className="border-t border-sidebar-border p-3">
            <a
              href={`mailto:${supportEmail}`}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent/80"
            >
              Help Center
            </a>
          </div>
        ) : null}
      </aside>

      <div className="flex flex-1 flex-col pb-20 pt-14 sm:pb-24 sm:pt-16 md:ml-64 md:pb-16">
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 py-3 text-center text-xs text-muted-foreground backdrop-blur md:left-64 md:text-sm">
        <p>&copy; 2026 UniConnect · Community Monitoring and Support Platform</p>
      </footer>
    </div>
  );
}
