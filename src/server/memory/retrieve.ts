import type { PrismaClient } from "@prisma/client";
import { embedTexts } from "@/server/memory/embeddings";
import { fallbackRank } from "@/server/memory/fallback-embed";
import { runMemoryPython } from "@/server/memory/python-bridge";
import { searchMemoryPgvector } from "@/server/memory/pgvector";

export type RetrievedMemory = {
  id: string;
  content: string;
  kind: string;
  score: number;
};

export async function retrieveRelevantMemories(
  prisma: PrismaClient,
  userId: string,
  query: string,
  limit = 8,
): Promise<RetrievedMemory[]> {
  const [queryVec] = await embedTexts([query]);
  if (!queryVec) return [];

  const pgHits = await searchMemoryPgvector(prisma, userId, queryVec, limit);
  if (pgHits.length) {
    const rows = await prisma.memoryEntry.findMany({
      where: { userId, id: { in: pgHits.map((h) => h.id) } },
      select: { id: true, content: true, kind: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const out: RetrievedMemory[] = [];
    for (const hit of pgHits) {
      const row = byId.get(hit.id);
      if (row) out.push({ id: row.id, content: row.content, kind: row.kind, score: hit.score });
    }
    if (out.length) {
      await prisma.memoryEntry.updateMany({
        where: { id: { in: out.map((m) => m.id) } },
        data: { lastAccessedAt: new Date() },
      });
      return out;
    }
  }

  const pool = await prisma.memoryEntry.findMany({
    where: { userId },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: 250,
    select: { id: true, content: true, kind: true, embedding: true, importance: true },
  });
  if (!pool.length) return [];

  const rankedPython = await runMemoryPython<{
    ranked: { id: string; score: number }[];
  }>("rank", {
    query,
    candidates: pool.map((p) => ({
      id: p.id,
      text: p.content,
      embedding: p.embedding,
      importance: p.importance,
    })),
    top_k: limit,
  });

  let ranked = rankedPython?.ranked;
  if (!ranked?.length) {
    ranked = fallbackRank(
      query,
      pool.map((p) => ({
        id: p.id,
        embedding: (p.embedding as number[] | null) ?? null,
        importance: p.importance,
      })),
      limit,
    );
  }

  const byId = new Map(pool.map((p) => [p.id, p]));
  const result: RetrievedMemory[] = [];
  for (const hit of ranked) {
    const row = byId.get(hit.id);
    if (row) result.push({ id: row.id, content: row.content, kind: row.kind, score: hit.score });
  }
  if (result.length) {
    await prisma.memoryEntry.updateMany({
      where: { id: { in: result.map((m) => m.id) } },
      data: { lastAccessedAt: new Date() },
    });
  }
  return result;
}

export async function loadUserPreferences(prisma: PrismaClient, userId: string) {
  return prisma.userPreference.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: { key: true, value: true, confidence: true },
  });
}

export async function loadConversationSummary(prisma: PrismaClient, conversationId: string) {
  const row = await prisma.conversationMemory.findUnique({
    where: { conversationId },
    select: { summary: true },
  });
  return row?.summary?.trim() ?? "";
}