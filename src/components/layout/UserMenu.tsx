"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Coins,
  LogOut,
  MessageSquare,
  Settings,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-fetch";

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

const ITEMS = [
  { href: "/account", label: "My Account", icon: UserRound },
  { href: "/account#credits", label: "My Credits", icon: Coins, showBalance: true },
  { href: "/account#conversations", label: "My Conversations", icon: MessageSquare },
  { href: "/account#memory", label: "AI Memory", icon: Brain },
  { href: "/account#settings", label: "Settings", icon: Settings },
] as const;

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const response = await apiFetch("/api/credits/balance", { cache: "no-store" });
      const body = await response.json();
      if (!cancelled && body.success) setCredits(body.data.balance);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return <div className="h-11 w-40 animate-pulse rounded-xl border border-zinc-800 bg-[#101010]" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/sign-in" className="rounded-lg border border-red-600 px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-600/10 hover:text-white">
          SIGN IN
        </Link>
        <Link href="/sign-up" className="rounded-lg border border-red-600 bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700">
          SIGN UP
        </Link>
      </div>
    );
  }

  const avatarUrl = user.image;
  const label = initials(user.name, user.email);
  const displayName = user.name ?? user.email.split("@")[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-[#101010] px-3 py-2 text-left transition hover:border-red-600"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar url={avatarUrl} label={label} />
        <span className="hidden max-w-[160px] truncate text-sm text-zinc-200 sm:inline">{displayName}</span>
        <span className="text-zinc-500">▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-zinc-800 bg-[#111] py-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)] animate-[chat-toolbar-menu-in_160ms_ease]"
          role="menu"
        >
          <div className="flex items-center gap-3 border-b border-zinc-800 px-4 pb-3">
            <Avatar url={avatarUrl} label={label} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Signed in
              </p>
            </div>
          </div>
          <nav className="mt-2 flex flex-col">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-red-400"
                onClick={() => setOpen(false)}
              >
                <item.icon size={16} className="mt-0.5 shrink-0 text-zinc-500" />
                <span>
                  {item.label}
                  {"showBalance" in item && (
                    <span className="mt-0.5 block text-xs text-purple-400">
                      {credits == null ? "…" : `${credits.toLocaleString("en-US")} CR`}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </nav>
          <button
            type="button"
            role="menuitem"
            className="mt-2 flex w-full items-center gap-3 border-t border-zinc-800 px-4 pt-3 text-left text-sm text-red-500 hover:bg-red-950/20"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ url, label }: { url?: string | null; label: string }) {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-red-900 bg-black text-xs font-bold text-red-400">
      {url ? (
        <Image src={url} alt="" width={36} height={36} className="h-full w-full object-cover" unoptimized />
      ) : (
        label
      )}
    </span>
  );
}
