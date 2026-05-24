"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { AppImage } from "@/components/ui/AppImage";
import { Button } from "@/components/ui/button";

type ProfileMenuProps = {
  role: "USER" | "ADMIN";
  name: string;
  email: string;
  profilePicture?: string | null;
};

export function ProfileMenu({ role, name, email, profilePicture }: ProfileMenuProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
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
                <Link href="/delete-account" className="block rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10">
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
  );
}
