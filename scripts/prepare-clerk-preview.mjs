/**
 * Configure Clerk on Vercel **preview only**; production stays on Auth.js.
 * Reads Clerk test keys from .env.local (never prints values).
 *
 * Usage: node scripts/prepare-clerk-preview.mjs
 * Requires: vercel CLI linked to the darkbyte project.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const localPath = path.join(root, ".env.local");
if (!fs.existsSync(localPath)) {
  console.error("Missing .env.local with Clerk test keys");
  process.exit(1);
}

const keys = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_WEBHOOK_SECRET",
];
const values = new Map();
for (const line of fs.readFileSync(localPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let val = m[2].trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (val) values.set(m[1], val);
}

const spawnOpts = { encoding: "utf8", cwd: root, shell: true };

function upsertPreview(name, value) {
  const escaped = value.replace(/"/g, '\\"');
  const r = spawnSync(`vercel env add ${name} preview --value "${escaped}" --yes --sensitive`, spawnOpts);
  if (r.status !== 0 && !`${r.stderr || ""}${r.stdout || ""}`.match(/already/i)) {
    console.error(`preview env failed: ${name}`);
    return false;
  }
  return true;
}

function upsertProduction(name, value) {
  const escaped = value.replace(/"/g, '\\"');
  const r = spawnSync(`vercel env add ${name} production --value "${escaped}" --yes`, spawnOpts);
  if (r.status !== 0 && !`${r.stderr || ""}${r.stdout || ""}`.match(/already/i)) {
    console.error(`production env failed: ${name}`);
    return false;
  }
  return true;
}

let ok = true;
for (const key of keys) {
  const val = values.get(key);
  if (!val) {
    console.warn(`skip ${key} (not in .env.local)`);
    continue;
  }
  if (!upsertPreview(key, val)) ok = false;
}

upsertPreview("AUTH_PROVIDER", "clerk");
upsertPreview("NEXT_PUBLIC_AUTH_PROVIDER", "clerk");

upsertProduction("AUTH_PROVIDER", "authjs");
upsertProduction("NEXT_PUBLIC_AUTH_PROVIDER", "authjs");

console.log(ok ? "Clerk preview env prepared (production remains authjs)." : "Completed with errors — check vercel env.");
process.exit(ok ? 0 : 1);