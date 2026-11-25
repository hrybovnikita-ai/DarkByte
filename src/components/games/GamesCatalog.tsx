"use client";

import { useEffect, useState } from "react";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

type Game = {
  id: string;
  title: string;
  genre: string;
  description: string;
  playable: boolean;
};

export default function GamesCatalog() {
  const [games, setGames] = useState<Game[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/games?pageSize=20");
      const body = await response.json();
      if (!cancelled && body.success) {
        setGames(body.data as Game[]);
      } else if (!cancelled) {
        setGames([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!games) {
    return (
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <PixelSkeleton key={i} lines={3} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <p className="mt-8 text-zinc-500">No games published in the database yet.</p>
    );
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2">
      {games.map((game) => (
        <article
          key={game.id}
          className="border border-zinc-800 bg-[#101010] p-6"
        >
          <h3 className="text-xl font-bold text-orange-500">{game.title}</h3>
          <p className="mt-2 text-zinc-500">{game.genre}</p>
          <p className="mt-4 text-sm text-zinc-400">{game.description}</p>
          <p className="mt-4 border border-dashed border-orange-600 px-3 py-2 text-center text-sm text-orange-500">
            {game.playable ? "PLAYABLE PROTOTYPE" : "COMING SOON"}
          </p>
        </article>
      ))}
    </div>
  );
}