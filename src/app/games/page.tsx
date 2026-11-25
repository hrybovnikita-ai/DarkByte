import Link from "next/link";
import WorldPixelScenes from "@/components/pixel-art/WorldPixelScenes";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollChrome from "@/components/layout/ScrollChrome";

import GamesCatalog from "@/components/games/GamesCatalog";
import { fetchWorldBySlug } from "@/server/data/worlds-query";

export default async function GamesPage() {
  const arcade = await fetchWorldBySlug("arcade");

  return (
    <div className="min-h-screen bg-[var(--db-dark-black)] font-mono text-white">
      <ScrollChrome />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-24">
        <p className="tracking-[0.2em] text-[var(--db-orange)]">
          {"// RETRO ARCADE HUB"}
        </p>
        <h1 className="pixel-font mt-6 text-2xl sm:text-4xl">
          {arcade?.title ?? "RETRO ARCADE"}
        </h1>
        <p className="mt-6 max-w-3xl text-xl text-zinc-400">
          {arcade?.longDescription}
        </p>

        <div className="mt-12 overflow-hidden border border-zinc-800">
          <WorldPixelScenes scene="arcade" />
        </div>

        <h2 className="pixel-font mt-16 text-lg">CABINET SELECT</h2>
        <p className="mt-2 text-zinc-500">
          Data loaded from GET /api/games. Titles not marked playable are not
          implemented yet.
        </p>

        <GamesCatalog />

        <Link
          href="/#retro-arcade"
          className="mt-12 inline-block border border-orange-600 px-8 py-4 text-orange-500"
        >
          VIEW ON HOME PAGE
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}