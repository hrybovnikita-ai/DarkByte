"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import PixelSkeleton from "@/components/ui/PixelSkeleton";
import Link from "next/link";

type Stats = {
  worlds: number;
  monsters: number;
  stories: number;
  games: number;
};

type WorldRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [worlds, setWorlds] = useState<WorldRow[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setForbidden(true);
      return;
    }

    const fetchOpts = { credentials: "include" as RequestCredentials };
    const [worldRes, monsterRes, storyRes, gameRes] = await Promise.all([
      fetch("/api/worlds?pageSize=50&status=PUBLISHED", fetchOpts),
      fetch("/api/monsters?pageSize=1", fetchOpts),
      fetch("/api/stories?pageSize=1", fetchOpts),
      fetch("/api/games?pageSize=1", fetchOpts),
    ]);

    if (worldRes.status === 403) {
      setForbidden(true);
      return;
    }

    const worldBody = await worldRes.json();
    const monsterBody = await monsterRes.json();
    const storyBody = await storyRes.json();
    const gameBody = await gameRes.json();

    if (!worldBody.success) {
      setMessage(worldBody.error?.message ?? "Failed to load admin data.");
      return;
    }

    setWorlds(
      (worldBody.data as WorldRow[]).map((w: WorldRow & { status?: string }) => ({
        id: w.id,
        title: w.title,
        slug: w.slug,
        status: w.status ?? "PUBLISHED",
      })),
    );
    setStats({
      worlds: worldBody.meta?.total ?? worldBody.data.length,
      monsters: monsterBody.meta?.total ?? 0,
      stories: storyBody.meta?.total ?? 0,
      games: gameBody.meta?.total ?? 0,
    });
  }, [user]);

  useEffect(() => {
    if (!loading && user) {
      queueMicrotask(() => {
        void load();
      });
    }
  }, [loading, user, load]);

  async function deleteWorld(id: string, title: string) {
    if (!window.confirm(`Delete world "${title}"? This cannot be undone.`)) {
      return;
    }
    const response = await fetch(`/api/worlds/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.status === 204) {
      setMessage(`Deleted ${title}.`);
      void load();
      return;
    }
    const body = await response.json();
    setMessage(body.error?.message ?? "Delete failed.");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <PixelSkeleton lines={5} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="pixel-font text-2xl text-red-500">ADMIN DASHBOARD</h1>
        <p className="mt-6 text-zinc-400">
          Sign in with an administrator account to manage content.
        </p>
        <Link
          href="/sign-in"
          className="mt-8 inline-block border border-red-600 px-6 py-3 text-red-500"
        >
          SIGN IN
        </Link>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="pixel-font text-2xl text-red-500">ACCESS DENIED</h1>
        <p className="mt-6 text-zinc-400">
          Your account does not have the ADMIN role.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <p className="tracking-widest text-red-500">{"// ADMIN CONTROL"}</p>
      <h1 className="pixel-font mt-4 text-2xl">DARKBYTE ADMIN</h1>

      {message && (
        <p className="mt-4 border border-zinc-800 bg-[#101010] p-3 text-sm text-amber-400">
          {message}
        </p>
      )}

      {!stats ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <PixelSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {[
            ["Worlds", stats.worlds],
            ["Monsters", stats.monsters],
            ["Stories", stats.stories],
            ["Games", stats.games],
          ].map(([label, value]) => (
            <article
              key={String(label)}
              className="border border-zinc-800 bg-[#101010] p-6 text-lg text-white"
            >
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-red-500">{value}</p>
            </article>
          ))}
        </div>
      )}

      <h2 className="mt-14 text-xl font-bold">Worlds</h2>
      {!worlds ? (
        <PixelSkeleton className="mt-6" lines={6} />
      ) : (
        <ul className="mt-6 space-y-3">
          {worlds.map((world) => (
            <li
              key={world.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-zinc-800 bg-[#101010] p-4"
            >
              <div>
                <p className="font-bold">{world.title}</p>
                <p className="text-sm text-zinc-500">
                  {world.slug} · {world.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteWorld(world.id, world.title)}
                className="border border-red-800 px-4 py-2 text-sm text-red-500 hover:bg-red-950/40"
              >
                DELETE
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-zinc-600">
        Use REST endpoints with your signed-in session for full CRUD
        (create, update, publish). See docs/openapi.yaml.
      </p>
    </main>
  );
}