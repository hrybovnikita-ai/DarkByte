import nextEnv from "@next/env";
import { resolveAvailableModels } from "../src/server/ai/discover.ts";
import { streamModel } from "../src/server/ai/providers.ts";

nextEnv.loadEnvConfig(process.cwd());

const prompt = [{ role: "user", content: "Reply with one short word: OK" }];

const models = await resolveAvailableModels(true);
console.log("Available models:", models.map((m) => m.id).join(", ") || "(none)");

for (const model of models) {
  let text = "";
  try {
    await streamModel(model, prompt, (delta) => { text += delta; });
    console.log(`[ok] ${model.provider} :: ${model.id} :: ${text.slice(0, 80)}`);
  } catch (error) {
    console.log(`[fail] ${model.provider} :: ${model.id} :: ${error instanceof Error ? error.message : error}`);
  }
}