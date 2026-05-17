"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/AppImage";
import { cn } from "@/lib/utils";

type AppShellProps = {
  role: "USER" | "ADMIN";
  name: string;
  email: string;
  profilePicture?: string | null;
  children: React.ReactNode;
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

export function AppShell({ role, name, email, profilePicture, children }: AppShellProps) {
  const pathname = usePathname();
  const navItems = role === "ADMIN" ? adminNav : userNav;
  const logoHref = role === "ADMIN" ? "/admin/dashboard" : "/home";
  const supportEmail = "uniconnect12345@gmail.com";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // Portaled modals (e.g. ConfirmDialog) render outside menuRef; ignore them.
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setMenuOpen(false);
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
            <div ref={menuRef} className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-input pl-1 pr-3"
                onClick={() => setMenuOpen((current) => !current)}
              >
                {profilePicture ? (
                  <AppImage
                    src={profilePicture}
                    alt={`${name} profile`}
                    className="h-7 w-7 rounded-full object-cover"
                    fallbackSrc="/uploads/default-profile.svg"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials || "U"}
                  </span>
                )}
                <span className="hidden max-w-[10rem] truncate sm:inline">{name}</span>
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
                  <div className="border-b px-3 py-2">
                    <p className="text-sm font-medium leading-none">{name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                  <div className="p-1">
                    {role === "ADMIN" ? (
                      <>
                        <Link href="/admin/change-password" className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                          Change Password
                        </Link>
                        <Link href="/admin/change-email" className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                          Change Email
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/profile" className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                          View Profile
                        </Link>
                        <Link href="/change-password" className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                          Change Password
                        </Link>
                        <Link
                          href="/delete-account"
                          className="block rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                        >
                          Delete Account
                        </Link>
                      </>
                    )}
                    <div className="mt-1 border-t pt-1">
                      <LogoutButton className="w-full justify-start rounded-md font-normal" variant="ghost" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
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
