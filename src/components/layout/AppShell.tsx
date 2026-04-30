"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { AppImage } from "@/components/ui/AppImage";

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-rose-100 via-white to-lime-100">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-black/20 bg-sidebar text-white shadow-[0_12px_30px_rgba(126,104,90,0.35)]">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={logoHref} className="text-lg font-semibold tracking-wide transition hover:opacity-90">
            UniConnect
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="rounded-full border border-white/40 px-3 py-1 text-sm md:hidden"
            >
              Menu
            </button>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-black bg-white px-3 py-1.5 text-sm text-black shadow-sm"
              >
              {profilePicture ? (
                <AppImage
                  src={profilePicture}
                  alt={`${name} profile`}
                  className="h-8 w-8 rounded-full object-cover"
                  fallbackSrc="/uploads/default-profile.svg"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-white">{initials || "U"}</span>
              )}
              <span className="hidden sm:inline">{name}</span>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/10 bg-cardBg p-3 text-textPrimary shadow-xl">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-textSecondary">{email}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {role === "ADMIN" ? (
                      <>
                        <Link href="/admin/change-password" className="block rounded px-2 py-1 hover:bg-mainBg">Change Password</Link>
                        <Link href="/admin/change-email" className="block rounded px-2 py-1 hover:bg-mainBg">Change Email</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/profile" className="block rounded px-2 py-1 hover:bg-mainBg">View Profile</Link>
                        <Link href="/change-password" className="block rounded px-2 py-1 hover:bg-mainBg">Change Password</Link>
                        <Link href="/delete-account" className="block rounded px-2 py-1 text-statusRejected hover:bg-mainBg">Delete Account</Link>
                      </>
                    )}
                    <LogoutButton className="w-full rounded-lg border border-black bg-black px-3 py-2 text-left text-sm text-white hover:bg-slate-900" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="fixed inset-0 top-16 z-20 bg-black/40 md:hidden" onClick={() => setMobileNavOpen(false)}>
          <aside className="h-full w-72 bg-sidebar p-4 text-white" onClick={(event) => event.stopPropagation()}>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl border border-transparent px-3 py-2 text-sm font-medium hover:border-black hover:bg-black hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 border-t border-white/20 pt-4">
              <a href={`mailto:${supportEmail}`} className="block rounded-xl border border-white/30 px-3 py-2 text-sm font-medium hover:bg-black">
                Help Center
              </a>
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="fixed left-0 top-16 z-10 hidden h-[calc(100vh-4rem)] w-64 border-r border-primary/10 bg-sidebar p-4 text-white md:block">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-xl border border-transparent px-3 py-2 text-sm font-medium hover:border-black hover:bg-black hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t border-white/20 pt-4">
          <a href={`mailto:${supportEmail}`} className="block rounded-xl border border-white/30 px-3 py-2 text-sm font-medium hover:bg-black">
            Help Center
          </a>
        </div>
      </aside>

      <div className="flex-1 pt-16 md:ml-64">
        <main className="p-3 sm:p-5 md:p-6">
          {children}
        </main>
      </div>

      <footer className="mt-auto bg-sidebar py-6 text-center text-sm text-white md:ml-64">
        <p className="font-semibold">UniConnect</p>
        <p>Community Monitoring and Support Platform</p>
        <p className="mt-1">
          Contact us: <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>
        </p>
        <p className="mt-1">&copy; {new Date().getFullYear()} UniConnect</p>
      </footer>
    </div>
  );
}
