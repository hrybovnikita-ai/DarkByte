import { z } from "zod";

const publishStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const worldCreateSchema = z.object({
  slug: z.string().min(1).max(64),
  code: z.string().min(1).max(16),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(200),
  headline: z.string().min(1).max(300),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  buttonLabel: z.string().min(1).max(120),
  routePath: z.string().min(1).max(200),
  sceneId: z.string().min(1).max(64),
  themePrimary: z.string().min(1),
  themeSecondary: z.string().min(1),
  themeAccent: z.string().min(1),
  themeGlow: z.string().min(1),
  atmosphereClass: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  status: publishStatus.optional(),
  sortOrder: z.number().int().optional(),
});

export const worldUpdateSchema = worldCreateSchema.partial();

export const monsterCreateSchema = z.object({
  externalId: z.string().max(32).optional().nullable(),
  name: z.string().min(1).max(200),
  threat: z.string().min(1).max(64),
  description: z.string().min(1),
  icon: z.string().max(16).optional().nullable(),
  worldId: z.string().cuid().optional().nullable(),
  status: publishStatus.optional(),
});

export const monsterUpdateSchema = monsterCreateSchema.partial();

export const storyCreateSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  summary: z.string().min(1),
  body: z.string().min(1),
  worldId: z.string().cuid().optional().nullable(),
  status: publishStatus.optional(),
});

export const storyUpdateSchema = storyCreateSchema.partial();

export const gameCreateSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  genre: z.string().min(1).max(120),
  description: z.string().min(1),
  playable: z.boolean().optional(),
  worldId: z.string().cuid().optional().nullable(),
  status: publishStatus.optional(),
});

export const gameUpdateSchema = gameCreateSchema.partial();

export const secretFileCreateSchema = z.object({
  fileCode: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  classification: z.string().min(1).max(64),
  content: z.string().min(1),
  status: publishStatus.optional(),
});

export const secretFileUpdateSchema = secretFileCreateSchema.partial();

export const pixelProjectCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  dataJson: z.record(z.string(), z.unknown()).optional(),
  status: publishStatus.optional(),
});

export const pixelProjectUpdateSchema = pixelProjectCreateSchema.partial();

export const favoriteCreateSchema = z.object({
  targetType: z.enum([
    "WORLD",
    "MONSTER",
    "STORY",
    "GAME",
    "SECRET_FILE",
    "PIXEL_PROJECT",
  ]),
  targetId: z.string().min(1),
});

export const achievementCreateSchema = z.object({
  code: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  points: z.number().int().min(0).optional(),
  status: publishStatus.optional(),
});

export const achievementUpdateSchema = achievementCreateSchema.partial();

export const userPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});