import Link from "next/link";
import { WORLDS } from "@/config/worlds";

const PLATFORM = [
  { href: "/#features", label: "Modules" },
  { href: "/#ai-chat", label: "AI Chat" },
  { href: "/monsters", label: "Monster Database" },
  { href: "/terminal", label: "Cyber Terminal" },
  { href: "/sign-in", label: "Sign In" },
  { href: "/sign-up", label: "Sign Up" },
];

const ENTERTAINMENT = [
  { href: "/games", label: "Retro Arcade" },
  { href: "/#horror-games", label: "Horror Games" },
  { href: "/#horror-world", label: "Horror Universe" },
  { href: "/#classified-archive", label: "Secret Files" },
];

const INFORMATION = [
  { href: "/#digital-worlds", label: "Digital Worlds" },
  { href: "/worlds", label: "World Index" },
  { href: "/#home", label: "About DarkByte" },
  { href: "/sign-up", label: "Join Early Access" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-900 bg-[#060606]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-xl font-black tracking-widest text-red-500">
            DARKBYTE
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500">
            Horror, pixels, intelligence and eight atmospheric dimensions in one
            immersive universe.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-widest text-zinc-300">
            WORLDS
          </h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            {WORLDS.map((w) => (
              <li key={w.id}>
                <Link
                  href={w.href}
                  className="transition hover:text-white"
                  style={{ color: undefined }}
                >
                  <span className="text-zinc-500 hover:text-inherit">
                    {w.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-widest text-zinc-300">
            PLATFORM
          </h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            {PLATFORM.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-red-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="mb-4 mt-8 text-sm font-bold tracking-widest text-zinc-300">
            ENTERTAINMENT
          </h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            {ENTERTAINMENT.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-red-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-widest text-zinc-300">
            INFORMATION
          </h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            {INFORMATION.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-red-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © 2026 DarkByte. All rights reserved. Fictional entertainment.
          </p>
          <div className="flex items-center gap-2 text-xs text-green-500">
            <span className="h-2 w-2 bg-green-500" />
            DEMO INTERFACE v2.0
          </div>
        </div>
      </div>
    </footer>
  );
}