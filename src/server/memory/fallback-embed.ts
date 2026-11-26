import { createHash } from "node:crypto";

const DIM = 384;

/** Deterministic lightweight fallback when Python / sentence-transformers unavailable (tests, CI). */
export function fallbackEmbed(text: string): number[] {
  const vec = new Array<number>(DIM).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    const hash = createHash("sha256").update(token).digest();
    for (let i = 0; i < DIM; i += 1) {
      vec[i] += (hash[i % hash.length] / 255 - 0.5) * 0.15;
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

export function fallbackRank(
  query: string,
  candidates: { id: string; embedding: number[] | null; importance: number }[],
  topK = 8,
  minScore = 0.15,
) {
  const q = fallbackEmbed(query);
  const scored = candidates
    .filter((c) => c.embedding && c.embedding.length)
    .map((c) => {
      const sim = cosineSimilarity(q, c.embedding!);
      const score = sim + c.importance * 0.08;
      return { id: c.id, score, similarity: sim };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}