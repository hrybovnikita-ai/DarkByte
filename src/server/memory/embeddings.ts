import { runMemoryPython } from "@/server/memory/python-bridge";
import { fallbackEmbed } from "@/server/memory/fallback-embed";
import { redactSensitiveText } from "@/server/memory/redact";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const clean = texts.map((t) => redactSensitiveText(t).trim()).filter(Boolean);
  if (!clean.length) return [];
  const result = await runMemoryPython<{ embeddings: number[][] }>("embed", { texts: clean });
  if (result?.embeddings?.length === clean.length) return result.embeddings;
  return clean.map((t) => fallbackEmbed(t));
}