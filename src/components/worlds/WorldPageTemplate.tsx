import Link from "next/link";
import type { WorldConfig } from "@/config/worlds";
import WorldPixelScenes from "@/components/pixel-art/WorldPixelScenes";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollChrome from "@/components/layout/ScrollChrome";

type Props = {
  world: WorldConfig;
};

export default function WorldPageTemplate({ world }: Props) {
  return (
    <div className="min-h-screen bg-[var(--db-dark-black)] font-mono text-white">
      <ScrollChrome />
      <SiteHeader />

      <main>
        <section
          className={`relative overflow-hidden px-6 py-24 ${world.atmosphereClass}`}
        >
          <div className="mx-auto max-w-7xl">
            <p
              className="mb-4 tracking-[0.2em]"
              style={{ color: world.theme.primary }}
            >
              {`${world.number} // ${world.category}`}
            </p>
            <h1 className="pixel-font text-2xl sm:text-4xl">{world.title}</h1>
            <p className="mt-6 max-w-3xl text-xl text-zinc-400">
              {world.description}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div
            className="overflow-hidden border border-zinc-800 bg-[#101010]"
            style={{ boxShadow: `0 0 50px ${world.theme.glow}` }}
          >
            <div className="aspect-video w-full">
              <WorldPixelScenes scene={world.slug} />
            </div>
          </div>

          <article className="mt-12 max-w-3xl space-y-6 text-lg leading-relaxed text-zinc-400">
            <p>{world.longDescription}</p>
            <p>
              This route is part of DARKBYTE 2.0&apos;s multicolor pixel universe.
              Explore related modules from the home page or jump directly into
              adjacent worlds using the footer navigation.
            </p>
          </article>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/worlds"
              className="border border-zinc-600 px-6 py-3 text-sm text-zinc-300 transition hover:border-zinc-400"
            >
              ALL WORLDS
            </Link>
            <Link
              href="/"
              className="border px-6 py-3 text-sm font-bold transition hover:bg-white/5"
              style={{
                borderColor: world.theme.primary,
                color: world.theme.primary,
              }}
            >
              BACK TO HOME
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}