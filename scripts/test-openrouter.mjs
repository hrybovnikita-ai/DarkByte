/**
 * Real OpenRouter connectivity check (requires OPENROUTER_API_KEY).
 */
import nextEnv from "@next/env";
import { AI_MODELS } from "../src/lib/ai-models.ts";
import { streamModel } from "../src/server/ai/providers.ts";

nextEnv.loadEnvConfig(process.cwd());

const model = AI_MODELS.find((m) => m.provider === "openrouter");
if (!model) {
  console.error("No OpenRouter model in catalog");
  process.exit(1);
}
if (!process.env.OPENROUTER_API_KEY?.trim()) {
  console.error("OPENROUTER_API_KEY is not set — skip");
  process.exit(0);
}

let text = "";
try {
  await streamModel(model, [{ role: "user", content: "Reply with exactly: OPENROUTER_OK" }], (d) => {
    text += d;
  });
  console.log(`[ok] ${model.id} :: ${text.slice(0, 120)}`);
  if (!/OPENROUTER_OK/i.test(text)) {
    console.error("Unexpected response body");
    process.exit(1);
  }
  console.log("PASS openrouter");
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (/billing is unavailable on the provider side/i.test(msg)) {
    console.log(`[verify] OpenRouter reachable; upstream billing blocked (no DARKBYTE credits charged).`);
    console.log("PASS openrouter-connectivity");
    process.exit(0);
  }
  console.error(`[fail] ${msg}`);
  process.exit(1);
}