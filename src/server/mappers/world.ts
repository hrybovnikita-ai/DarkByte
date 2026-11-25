import type { World } from "@prisma/client";
import type { WorldConfig, WorldSceneId } from "@/config/worlds";

export function mapWorldToConfig(world: World): WorldConfig {
  return {
    id: world.id,
    slug: world.slug as WorldSceneId,
    number: world.code,
    title: world.title,
    category: world.category,
    headline: world.headline,
    description: world.description,
    longDescription: world.longDescription,
    button: world.buttonLabel,
    href: world.routePath,
    theme: {
      primary: world.themePrimary,
      secondary: world.themeSecondary,
      accent: world.themeAccent,
      glow: world.themeGlow,
    },
    atmosphereClass: world.atmosphereClass,
  };
}

export function serializeWorld(world: World) {
  return {
    ...world,
    config: mapWorldToConfig(world),
  };
}