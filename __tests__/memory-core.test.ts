import { describe, expect, it } from "vitest";
import { redactSensitiveText } from "@/server/memory/redact";
import { memoryContentHash } from "@/server/memory/hash";
import { parseForgetIntent } from "@/server/memory/forget";
import { fallbackEmbed, cosineSimilarity, fallbackRank } from "@/server/memory/fallback-embed";

describe("memory security and dedup helpers", () => {
  it("redacts secrets before persistence", () => {
    const raw = "My api key: sk-abcdefghijklmnopqrstuvwxyz123456";
    expect(redactSensitiveText(raw)).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(redactSensitiveText(raw)).toContain("[redacted]");
  });

  it("hashes normalized content for deduplication", () => {
    expect(memoryContentHash("Hello   World")).toBe(memoryContentHash("hello world"));
  });

  it("parses forget intents", () => {
    expect(parseForgetIntent("please forget about my old job")).toEqual({
      forgetAll: false,
      phrases: ["my old job"],
    });
    expect(parseForgetIntent("forget everything please").forgetAll).toBe(true);
  });

  it("ranks similar fallback embeddings", () => {
    const a = fallbackEmbed("I prefer TypeScript for backend work");
    const b = fallbackEmbed("TypeScript backend preference");
    const c = fallbackEmbed("completely unrelated quantum physics");
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));
    const ranked = fallbackRank(
      "TypeScript backend",
      [
        { id: "1", embedding: b, importance: 0.5 },
        { id: "2", embedding: c, importance: 0.5 },
      ],
      2,
      0.01,
    );
    expect(ranked[0]?.id).toBe("1");
  });
});