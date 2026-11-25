import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src/app/api");

const resources = [
  { name: "worlds", handler: "worlds", fns: { list: "listWorlds", create: "createWorld", get: "getWorldById", put: "replaceWorld", patch: "patchWorld", del: "deleteWorld" } },
  { name: "monsters", handler: "monsters", fns: { list: "listMonsters", create: "createMonster", get: "getMonster", put: "putMonster", patch: "patchMonster", del: "deleteMonster" } },
  { name: "stories", handler: "stories", fns: { list: "listStories", create: "createStory", get: "getStory", put: "putStory", patch: "patchStory", del: "deleteStory" } },
  { name: "games", handler: "games", fns: { list: "listGames", create: "createGame", get: "getGame", put: "putGame", patch: "patchGame", del: "deleteGame" } },
  { name: "secret-files", handler: "secret-files", fns: { list: "listSecretFiles", create: "createSecretFile", get: "getSecretFile", put: "putSecretFile", patch: "patchSecretFile", del: "deleteSecretFile" } },
  { name: "pixel-projects", handler: "pixel-projects", fns: { list: "listPixelProjects", create: "createPixelProject", get: "getPixelProject", put: "putPixelProject", patch: "patchPixelProject", del: "deletePixelProject" } },
  { name: "achievements", handler: "achievements", fns: { list: "listAchievements", create: "createAchievement", get: "getAchievement", put: "putAchievement", patch: "patchAchievement", del: "deleteAchievement" } },
];

for (const r of resources) {
  const collectionDir = path.join(root, r.name);
  const idDir = path.join(collectionDir, "[id]");
  fs.mkdirSync(idDir, { recursive: true });

  const collection = `import { withApiHandler } from "@/server/api/with-handler";\nimport * as handlers from "@/server/api/handlers/${r.handler}";\n\nexport const GET = withApiHandler((request) => handlers.${r.fns.list}(request));\nexport const POST = withApiHandler((request) => handlers.${r.fns.create}(request));\n`;

  const item = `import { withApiHandler } from "@/server/api/with-handler";\nimport * as handlers from "@/server/api/handlers/${r.handler}";\n\nexport const GET = withApiHandler(async (request, context) => {\n  const { id } = await context.params;\n  return handlers.${r.fns.get}(request, id);\n});\n\nexport const PUT = withApiHandler(async (request, context) => {\n  const { id } = await context.params;\n  return handlers.${r.fns.put}(request, id);\n});\n\nexport const PATCH = withApiHandler(async (request, context) => {\n  const { id } = await context.params;\n  return handlers.${r.fns.patch}(request, id);\n});\n\nexport const DELETE = withApiHandler(async (request, context) => {\n  const { id } = await context.params;\n  return handlers.${r.fns.del}(request, id);\n});\n`;

  fs.writeFileSync(path.join(collectionDir, "route.ts"), collection);
  fs.writeFileSync(path.join(idDir, "route.ts"), item);
}

// favorites
const favDir = path.join(root, "favorites");
const favIdDir = path.join(favDir, "[id]");
fs.mkdirSync(favIdDir, { recursive: true });
fs.writeFileSync(
  path.join(favDir, "route.ts"),
  `import { withApiHandler } from "@/server/api/with-handler";\nimport * as handlers from "@/server/api/handlers/favorites";\n\nexport const GET = withApiHandler((request) => handlers.listFavorites(request));\nexport const POST = withApiHandler((request) => handlers.createFavorite(request));\n`,
);
fs.writeFileSync(
  path.join(favIdDir, "route.ts"),
  `import { withApiHandler } from "@/server/api/with-handler";\nimport * as handlers from "@/server/api/handlers/favorites";\n\nexport const GET = withApiHandler(async (request, context) => {\n  const { id } = await context.params;\n  return handlers.getFavorite(request, id);\n});\n\nexport const DELETE = withApiHandler(async (request, context) => {\n  const { id } = await context.params;\n  return handlers.deleteFavorite(request, id);\n});\n`,
);

// users/me
const meDir = path.join(root, "users/me");
fs.mkdirSync(meDir, { recursive: true });
fs.writeFileSync(
  path.join(meDir, "route.ts"),
  `import { withApiHandler } from "@/server/api/with-handler";\nimport * as handlers from "@/server/api/handlers/users";\n\nexport const GET = withApiHandler((request) => handlers.getCurrentUser(request));\nexport const PATCH = withApiHandler((request) => handlers.patchCurrentUser(request));\n`,
);

// health
const healthDir = path.join(root, "health");
fs.mkdirSync(healthDir, { recursive: true });
fs.writeFileSync(
  path.join(healthDir, "route.ts"),
  `import { withApiHandler } from "@/server/api/with-handler";\nimport { healthCheck } from "@/server/api/handlers/health";\n\nexport const GET = withApiHandler(() => healthCheck());\n`,
);

console.log("API routes generated.");