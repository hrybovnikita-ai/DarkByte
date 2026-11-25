import { PrismaClient } from "@prisma/client";
import { WORLDS } from "../src/config/worlds";
import { COMPANIES_CATALOG } from "../src/data/companies-catalog";
import {
  SEED_ACHIEVEMENTS,
  SEED_GAMES,
  SEED_MONSTERS,
  SEED_SECRET_FILES,
  SEED_STORIES,
} from "../src/data/seed-catalog";

const prisma = new PrismaClient();

async function main() {
  for (const [index, world] of WORLDS.entries()) {
    await prisma.world.upsert({
      where: { slug: world.slug },
      create: {
        slug: world.slug,
        code: world.number,
        title: world.title,
        category: world.category,
        headline: world.headline,
        description: world.description,
        longDescription: world.longDescription,
        buttonLabel: world.button,
        routePath: world.href,
        sceneId: world.slug,
        themePrimary: world.theme.primary,
        themeSecondary: world.theme.secondary,
        themeAccent: world.theme.accent,
        themeGlow: world.theme.glow,
        atmosphereClass: world.atmosphereClass,
        sortOrder: index,
        status: "PUBLISHED",
      },
      update: {
        code: world.number,
        title: world.title,
        category: world.category,
        headline: world.headline,
        description: world.description,
        longDescription: world.longDescription,
        buttonLabel: world.button,
        routePath: world.href,
        sceneId: world.slug,
        themePrimary: world.theme.primary,
        themeSecondary: world.theme.secondary,
        themeAccent: world.theme.accent,
        themeGlow: world.theme.glow,
        atmosphereClass: world.atmosphereClass,
        sortOrder: index,
        status: "PUBLISHED",
      },
    });
  }

  for (const monster of SEED_MONSTERS) {
    await prisma.monster.upsert({
      where: { externalId: monster.externalId },
      create: { ...monster, status: "PUBLISHED" },
      update: { ...monster, status: "PUBLISHED" },
    });
  }

  for (const story of SEED_STORIES) {
    await prisma.story.upsert({
      where: { slug: story.slug },
      create: { ...story, status: "PUBLISHED" },
      update: { ...story, status: "PUBLISHED" },
    });
  }

  for (const game of SEED_GAMES) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      create: { ...game, status: "PUBLISHED" },
      update: { ...game, status: "PUBLISHED" },
    });
  }

  for (const file of SEED_SECRET_FILES) {
    await prisma.secretFile.upsert({
      where: { fileCode: file.fileCode },
      create: { ...file, status: "PUBLISHED" },
      update: { ...file, status: "PUBLISHED" },
    });
  }

  for (const achievement of SEED_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      create: { ...achievement, status: "PUBLISHED" },
      update: { ...achievement, status: "PUBLISHED" },
    });
  }

  for (const [index, company] of COMPANIES_CATALOG.entries()) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      create: {
        slug: company.slug,
        name: company.name,
        logo: company.logo,
        website: company.website,
        description: company.description,
        category: company.category,
        accentColor: company.accentColor,
        accentPalette: company.accentPalette,
        integrationStatus: company.integrationStatus,
        sortOrder: index,
        status: "PUBLISHED",
      },
      update: {
        name: company.name,
        logo: company.logo,
        website: company.website,
        description: company.description,
        category: company.category,
        accentColor: company.accentColor,
        accentPalette: company.accentPalette,
        integrationStatus: company.integrationStatus,
        sortOrder: index,
        status: "PUBLISHED",
      },
    });
  }

  console.log("DarkByte seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });