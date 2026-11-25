import Link from "next/link";
import CyberTerminal from "@/components/terminal/CyberTerminal";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollChrome from "@/components/layout/ScrollChrome";
import { getWorldBySlug } from "@/config/worlds";

export default function TerminalPage() {
  const world = getWorldBySlug("terminal");

  return (
    <div className="min-h-screen bg-[var(--db-dark-black)] font-mono text-white">
      <ScrollChrome />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-24">
        <p className="tracking-[0.2em] text-[var(--db-neon-lime)]">
          {`${world?.number ?? "W06"} // SYSTEM INTERFACE`}
        </p>
        <h1 className="pixel-font mt-6 text-2xl sm:text-3xl">
          CYBER TERMINAL
        </h1>
        <p className="mt-6 text-lg text-zinc-400">
          {world?.longDescription}
        </p>
        <div className="mt-10">
          <CyberTerminal />
        </div>
        <p className="mt-6 text-sm text-zinc-600">
          Commands are predefined and run only in the browser. Try: help, about,
          worlds, status, clear.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block border border-zinc-600 px-6 py-3 text-sm text-zinc-300"
        >
          BACK TO HOME
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}