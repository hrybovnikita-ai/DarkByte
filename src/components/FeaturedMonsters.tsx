"use client";

import { useEffect, useState } from "react";
import PixelSkeleton from "@/components/ui/PixelSkeleton";
import { SEED_MONSTERS } from "@/data/seed-catalog";

type Monster = {
  id: string;
  externalId: string | null;
  name: string;
  threat: string;
  description: string;
  icon: string | null;
};

export default function FeaturedMonsters() {
  const [monsters, setMonsters] = useState<Monster[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/monsters?pageSize=12");
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.error?.message ?? "Failed to load monsters");
        }
        if (!cancelled) {
          setMonsters(body.data as Monster[]);
        }
      } catch {
        if (!cancelled) {
          setMonsters(
            SEED_MONSTERS.map((m, index) => ({
              id: String(index),
              externalId: m.externalId,
              name: m.name,
              threat: m.threat,
              description: m.description,
              icon: m.icon,
            })),
          );
          setError("Live database unavailable. Showing catalog fallback.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 text-center sm:text-left">
        <p className="mb-3 text-sm tracking-widest text-red-500">
          {"// FEATURED ENTRIES"}
        </p>
        <h2 className="pixel-font text-xl text-zinc-200 sm:text-2xl">
          ACTIVE MANIFEST
        </h2>
        {error && (
          <p className="mt-4 text-sm text-amber-500" role="status">
            {error}
          </p>
        )}
      </div>

      {!monsters ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PixelSkeleton key={i} lines={4} />
          ))}
        </div>
      ) : monsters.length === 0 ? (
        <p className="text-center text-zinc-500">No monsters published yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {monsters.map((monster) => (
            <article
              key={monster.id}
              className="group border border-zinc-800 bg-[#101010] p-6 transition-all duration-300 hover:border-red-800 hover:bg-[#141414]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                  {monster.icon ?? "??"}
                </span>
                <span className="text-xs tracking-widest text-zinc-600">
                  {monster.externalId ?? monster.id.slice(0, 8)}
                </span>
              </div>

              <p className="mb-2 text-xs tracking-widest text-red-600">
                {monster.threat}
              </p>

              <h3 className="mb-3 text-lg font-bold text-white">{monster.name}</h3>

              <p className="text-sm leading-7 text-zinc-500">
                {monster.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}