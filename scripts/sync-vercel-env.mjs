/**
 * Sync non-empty keys from .env.local to Vercel (production + preview).
 * Never prints secret values.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const localPath = path.join(root, ".env.local");
if (!fs.existsSync(localPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const spawnOpts = { encoding: "utf8", cwd: root, shell: true };
const existing = spawnSync("vercel env ls", spawnOpts);
const known = new Set(
  (existing.stdout || "")
    .split("\n")
    .map((line) => line.trim().split(/\s+/)[0])
    .filter((name) => /^[A-Z][A-Z0-9_]*$/.test(name)),
);

const lines = fs.readFileSync(localPath, "utf8").split(/\r?\n/);
const entries = new Map();
for (const line of lines) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  const key = m[1];
  let val = m[2].trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!val) continue;
  entries.set(key, val);
}

const productionUrl = "https://darkbyte-olive.vercel.app";
entries.set("AUTH_URL", productionUrl);
entries.set("CREDITS_APP_URL", productionUrl);
entries.set("MEMORY_DISABLE_PYTHON", "1");
entries.set("AUTH_TRUST_HOST", entries.get("AUTH_TRUST_HOST") || "true");

const skip = new Set(["TEST_DATABASE_URL", "DEV_CREDITS_SECRET"]);
let added = 0;
let skipped = 0;

for (const [key, value] of entries) {
  if (skip.has(key)) {
    skipped += 1;
    continue;
  }
  if (known.has(key)) {
    skipped += 1;
    continue;
  }
  const escaped = value.replace(/"/g, '\\"');
  const result = spawnSync(
    `vercel env add ${key} production --value "${escaped}" --yes --sensitive`,
    spawnOpts,
  );
  const preview = spawnSync(
    `vercel env add ${key} preview --value "${escaped}" --yes --sensitive`,
    spawnOpts,
  );
  if (preview.status !== 0 && !`${preview.stderr || ""}`.includes("already")) {
    console.error(`preview failed ${key}`);
  }
  if (result.status === 0) {
    added += 1;
    console.log(`added ${key}`);
  } else {
    console.error(`failed ${key}: ${(result.stderr || "").slice(0, 120)}`);
  }
}

console.log(`done added=${added} skipped=${skipped}`);