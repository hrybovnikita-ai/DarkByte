import Link from "next/link";
import type { WorldConfig } from "@/config/worlds";
import WorldPixelScenes from "@/components/pixel-art/WorldPixelScenes";

const PARTICLE_CLASS: Record<string, string> = {
  "atmosphere-ocean": "world-particles--ocean",
  "atmosphere-inferno": "world-particles--inferno",
  "atmosphere-frozen": "world-particles--frozen",
  "atmosphere-golden": "world-particles--golden",
  "atmosphere-cyber": "world-particles--cyber",
};

function WorldParticles({ atmosphereClass }: { atmosphereClass: string }) {
  const modifier = PARTICLE_CLASS[atmosphereClass];
  if (!modifier) {
    return null;
  }

  return (
    <div
      className={`world-particles pointer-events-none absolute inset-0 overflow-hidden opacity-40 ${modifier}`}
      aria-hidden="true"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23 + 10) % 85}%`,
            width: i % 2 ? 4 : 6,
            height: i % 2 ? 4 : 6,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}

type Props = {
  worlds: WorldConfig[];
};

export default function WorldSections({ worlds }: Props) {
  return (
  <>
    <section id="digital-worlds" className="border-y border-zinc-900 px-6 py-16 text-center">
      <p className="mb-4 tracking-[0.3em] text-[var(--db-ocean-blue)]">
        {"// MULTICOLOR PIXEL UNIVERSE"}
      </p>
      <h2 className="pixel-font text-xl sm:text-3xl">
        EIGHT DIGITAL WORLDS
      </h2>
      <p className="mx-auto mt-6 max-w-3xl text-xl text-zinc-400">
        Each dimension uses its own palette, atmosphere and pixel-art
        identity. Select a world below or scroll through the full gallery.
      </p>
    </section>

    {worlds.map((world, index) => {
      const imageFirst = index % 2 === 0;

      return (
        <section
          key={world.id}
          id={world.id}
          className={`section-reveal relative scroll-mt-28 border-b border-zinc-900 px-6 py-24 sm:py-28 ${world.atmosphereClass}`}
        >
          <WorldParticles atmosphereClass={world.atmosphereClass} />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div
              className={`group relative overflow-hidden border bg-[#101010] transition duration-500 hover:-translate-y-1 ${
                imageFirst ? "" : "lg:order-2"
              }`}
              style={{
                borderColor: `${world.theme.primary}55`,
                boxShadow: `0 0 45px ${world.theme.glow}`,
              }}
            >
              <div className="aspect-video overflow-hidden">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]">
                  <WorldPixelScenes scene={world.slug} />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-sm text-zinc-500">
                <span>
                  DARKBYTE // {world.number}
                </span>
                <span
                  className="motion-safe:animate-pulse"
                  style={{ color: world.theme.primary }}
                >
                  ● LIVE
                </span>
              </div>
            </div>

            <div className={imageFirst ? "" : "lg:order-1"}>
              <p
                className="mb-4 tracking-[0.2em]"
                style={{ color: world.theme.primary }}
              >
                {`${world.number} // ${world.category}`}
              </p>

              <h2
                className="pixel-font text-xl leading-relaxed sm:text-3xl"
                style={{ color: world.theme.accent }}
              >
                {world.title}
              </h2>

              <p className="mt-6 text-2xl font-bold text-white">
                {world.headline}
              </p>

              <p className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl">
                {world.description}
              </p>

              <p className="mt-5 text-base leading-relaxed text-zinc-500 sm:text-lg">
                {world.longDescription}
              </p>

              <Link
                href={world.href}
                className="mt-8 inline-block border px-7 py-4 text-sm font-bold tracking-wider transition hover:bg-white/5"
                style={{
                  borderColor: world.theme.primary,
                  color: world.theme.primary,
                  boxShadow: `0 0 20px ${world.theme.glow}`,
                }}
              >
                {world.button} →
              </Link>
            </div>
          </div>
        </section>
      );
    })}
  </>
  );
}