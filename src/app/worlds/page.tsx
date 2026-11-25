import Link from "next/link";
import { fetchPublishedWorlds } from "@/server/data/worlds-query";
import WorldPixelScenes from "@/components/pixel-art/WorldPixelScenes";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollChrome from "@/components/layout/ScrollChrome";

export default async function WorldsIndexPage() {
  const worlds = await fetchPublishedWorlds();

  return (
    <div className="min-h-screen bg-[var(--db-dark-black)] font-mono text-white">
      <ScrollChrome />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-24">
        <p className="tracking-[0.3em] text-red-500">{"// WORLD INDEX"}</p>
        <h1 className="pixel-font mt-6 text-2xl sm:text-4xl">
          DIGITAL DIMENSIONS
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-zinc-400">
          Eight themed worlds, each with unique palettes, atmosphere and routes.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href={world.href}
              className="group overflow-hidden border border-zinc-800 bg-[#101010] transition hover:-translate-y-1"
              style={{ boxShadow: `0 0 0 transparent` }}
            >
              <div className="aspect-video overflow-hidden border-b border-zinc-800">
                <WorldPixelScenes scene={world.slug} />
              </div>
              <div className="p-6">
                <h2
                  className="text-xl font-bold"
                  style={{ color: world.theme.primary }}
                >
                  {world.title}
                </h2>
                <p className="mt-3 text-zinc-500">{world.description}</p>
                <span
                  className="mt-4 inline-block text-sm font-bold"
                  style={{ color: world.theme.primary }}
                >
                  {world.button} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}