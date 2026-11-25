"use client";

import Link from "next/link";
import { useState } from "react";
import type { WorldConfig } from "@/config/worlds";
import WorldPixelScenes from "@/components/pixel-art/WorldPixelScenes";

type Props = {
  worlds: WorldConfig[];
};

export default function WorldSelector({ worlds }: Props) {
  const [active, setActive] = useState(0);
  const world = worlds[active];

  if (!world) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <p className="mb-4 text-center tracking-[0.25em] text-[var(--db-violet)]">
        {"// INTERACTIVE WORLD SELECTOR"}
      </p>
      <h2 className="pixel-font text-center text-xl sm:text-2xl">
        CHOOSE YOUR DIMENSION
      </h2>

      <div
        className="mt-12 overflow-hidden border border-zinc-800 bg-[#101010]"
        style={{ boxShadow: `0 0 40px ${world.theme.glow}` }}
      >
        <div className="aspect-video max-h-72 w-full border-b border-zinc-800 sm:max-h-96">
          <WorldPixelScenes scene={world.slug} />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 p-4">
          {worlds.map((w, i) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setActive(i)}
              className="border px-3 py-2 text-xs tracking-wider transition sm:text-sm"
              style={{
                borderColor: active === i ? w.theme.primary : "#3f3f46",
                color: active === i ? w.theme.primary : "#a1a1aa",
                backgroundColor:
                  active === i ? `${w.theme.primary}15` : "transparent",
              }}
            >
              {w.title}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="text-2xl font-bold" style={{ color: world.theme.primary }}>
            {world.title}
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">
            {world.longDescription}
          </p>
          <Link
            href={world.href}
            className="mt-6 inline-block border px-6 py-3 text-sm font-bold tracking-wider"
            style={{
              borderColor: world.theme.primary,
              color: world.theme.primary,
            }}
          >
            {world.button} →
          </Link>
        </div>
      </div>
    </section>
  );
}