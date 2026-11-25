#!/usr/bin/env node
/**
 * Windows-safe Prisma Client generation with EPERM retries.
 * Stop `next dev` / other Node processes if all retries fail.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const enginePath = path.join(
  root,
  "node_modules",
  ".prisma",
  "client",
  "query_engine-windows.dll.node",
);

const MAX_ATTEMPTS = 5;
const RETRY_MS = 800;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runGenerate() {
  return spawnSync("npx", ["prisma", "generate"], {
    cwd: root,
    shell: true,
    encoding: "utf-8",
    env: process.env,
  });
}

function outputLooksLikeEperm(result) {
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return text.includes("EPERM") || text.includes("operation not permitted");
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = runGenerate();
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    if (result.status === 0) {
      process.exit(0);
    }

    const isEperm = outputLooksLikeEperm(result);
    if (!isEperm || attempt === MAX_ATTEMPTS) {
      process.exit(result.status ?? 1);
    }

    process.stderr.write(
      `\n[prisma-generate] EPERM on attempt ${attempt}/${MAX_ATTEMPTS}. ` +
        `Waiting ${RETRY_MS}ms (stop next dev if this persists)…\n`,
    );
    await sleep(RETRY_MS);

    try {
      const clientDir = path.dirname(enginePath);
      if (fs.existsSync(clientDir)) {
        for (const file of fs.readdirSync(clientDir)) {
          if (file.startsWith("query_engine-windows.dll.node.tmp")) {
            fs.unlinkSync(path.join(clientDir, file));
          }
        }
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

await main();