"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WORLDS } from "@/config/worlds";
import UserMenu from "@/components/layout/UserMenu";

const NAV_LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#ai-chat", label: "AI" },
  { href: "/monsters", label: "Horror" },
  { href: "/#pixel-studio", label: "Studio" },
  { href: "/games", label: "Games" },
  { href: "/terminal", label: "Terminal" },
];

function navClass(pathname: string, href: string, active: boolean) {
  const base = "transition hover:text-red-500";
  if (active) {
    return `${base} text-red-500`;
  }
  if (href.startsWith("/") && !href.startsWith("/#") && pathname === href) {
    return `${base} text-red-500`;
  }
  return `${base} text-zinc-400`;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [worldsOpen, setWorldsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-black tracking-widest text-red-500"
        >
          DARK<span className="text-white">BYTE</span>
        </Link>

        <button
          type="button"
          className="border border-zinc-700 px-3 py-2 text-sm text-zinc-300 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "CLOSE" : "MENU"}
        </button>

        <nav
          className={`${
            menuOpen
              ? "absolute left-0 right-0 top-full flex max-h-[85vh] flex-col gap-4 overflow-y-auto border-b border-zinc-800 bg-[#080808] px-6 py-6"
              : "hidden"
          } md:static md:flex md:max-h-none md:flex-row md:items-center md:gap-5 md:overflow-visible md:border-0 md:bg-transparent md:p-0`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navClass(pathname, link.href, false)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setWorldsOpen(true)}
            onMouseLeave={() => setWorldsOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-2 text-zinc-400 transition hover:text-red-500"
              onClick={() => setWorldsOpen((o) => !o)}
              aria-expanded={worldsOpen}
            >
              Worlds
              <span className="text-red-500">▾</span>
            </button>

            <div
              className={`${
                worldsOpen ? "block" : "hidden"
              } md:absolute md:left-0 md:top-full md:mt-2 md:min-w-[280px]`}
            >
              <div className="mt-2 border border-zinc-800 bg-[#101010] p-2 shadow-xl md:mt-0">
                <Link
                  href="/worlds"
                  className="block border-b border-zinc-800 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                  onClick={() => {
                    setMenuOpen(false);
                    setWorldsOpen(false);
                  }}
                >
                  ALL WORLDS →
                </Link>
                {WORLDS.filter((w) => w.slug !== "terminal").map((world) => (
                  <Link
                    key={world.id}
                    href={world.href}
                    className="block px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5"
                    style={{ color: undefined }}
                    onClick={() => {
                      setMenuOpen(false);
                      setWorldsOpen(false);
                    }}
                  >
                    <span style={{ color: world.theme.primary }}>
                      {world.title}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/terminal"
                  className="block px-3 py-2 text-sm text-[var(--db-neon-lime)] hover:bg-white/5"
                  onClick={() => {
                    setMenuOpen(false);
                    setWorldsOpen(false);
                  }}
                >
                  CYBER TERMINAL
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden md:block">
          <UserMenu />
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-zinc-800 px-6 py-4 md:hidden">
          <UserMenu />
        </div>
      )}
    </header>
  );
}