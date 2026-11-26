import nextEnv from "@next/env";
import { resolveAvailableModels } from "../src/server/ai/discover.ts";
import { streamModel } from "../src/server/ai/providers.ts";

nextEnv.loadEnvConfig(process.cwd());
const models = await resolveAvailableModels(true);
const model = models.find((m) => m.id === "openai/gpt-oss-20b") ?? models[0];
if (!model) throw new Error("No models available");
let text = "";
await streamModel(model, [{ role: "user", content: "Reply with exactly: Hello from DARKBYTE" }], (d) => { text += d; });
console.log("model:", model.id);
console.log("response:", text.slice(0, 300));
if (!text.trim()) process.exit(1);
console.log("PASS");