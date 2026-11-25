import { cacheLife, cacheTag } from "next/cache";
import { WORLDS, type WorldConfig, type WorldSceneId } from "@/config/worlds";
import { getPrisma } from "@/lib/db";
import { mapWorldToConfig } from "@/server/mappers/world";

export async function fetchPublishedWorlds(): Promise<WorldConfig[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("worlds-published");

  const prisma = getPrisma();
  if (!prisma) {
    return WORLDS;
  }

  try {
    const rows = await prisma.world.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) {
      return WORLDS;
    }
    return rows.map(mapWorldToConfig);
  } catch {
    return WORLDS;
  }
}

export async function fetchWorldBySlug(slug: string): Promise<WorldConfig | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("world", `world-${slug}`);

  const prisma = getPrisma();
  if (prisma) {
    try {
      const row = await prisma.world.findFirst({
        where: { slug, status: "PUBLISHED" },
      });
      if (row) {
        return mapWorldToConfig(row);
      }
    } catch {
      // fallback below
    }
  }
  return WORLDS.find((w) => w.slug === slug as WorldSceneId) ?? null;
}