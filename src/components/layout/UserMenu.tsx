"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";

function initials(name: string | null | undefined, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse border border-zinc-800 bg-[#101010]" />
    );
  }

  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/sign-in"
          className="border border-red-600 px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-600/10 hover:text-white"
        >
          SIGN IN
        </Link>
        <Link
          href="/sign-up"
          className="border border-red-600 bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        >
          SIGN UP
        </Link>
      </div>
    );
  }

  const avatarUrl = user.image;
  const label = initials(user.name, user.email);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-3 border border-zinc-700 bg-[#101010] px-3 py-2 text-left transition hover:border-red-600"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden border border-red-900 bg-black text-xs font-bold text-red-500">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            label
          )}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm text-zinc-300 sm:inline">
          {user.name ?? user.email.split("@")[0]}
        </span>
        <span className="text-red-500">▾</span>
      </button>

      {open && (
        <MotionSafeMenu
          className="absolute right-0 z-50 mt-2 min-w-[220px] border border-zinc-800 bg-[#0a0a0a] py-2 shadow-[0_0_30px_rgba(220,38,38,0.15)]"
          role="menu"
        >
          <p className="border-b border-zinc-900 px-4 py-2 text-xs tracking-widest text-zinc-500">
            {`${user.role} // ${user.email}`}
          </p>
          <Link
            href="/account"
            className="block px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-red-400"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Account Settings
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="block px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-red-400"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            className="block w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-950/30"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            Log out
          </button>
        </MotionSafeMenu>
      )}
    </div>
  );
}

function MotionSafeMenu({
  className,
  role,
  children,
}: {
  className?: string;
  role?: string;
  children: ReactNode;
}) {
  return (
    <div className={className} role={role}>
      {children}
    </div>
  );
}