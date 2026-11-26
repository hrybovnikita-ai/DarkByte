import nextEnv from "@next/env";
import { spawnSync } from "node:child_process";
import path from "node:path";

nextEnv.loadEnvConfig(process.cwd());
const args = process.argv.slice(2);
const test = args.includes("--test");
const database = test ? process.env.TEST_DATABASE_URL : (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
if (!database) throw new Error(test ? "Set TEST_DATABASE_URL to a dedicated test database." : "Set DATABASE_URL or DATABASE_URL_UNPOOLED.");
const result = spawnSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "migrate", ...args.filter((arg) => arg !== "--test")], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: database },
});
process.exit(result.status ?? 1);
