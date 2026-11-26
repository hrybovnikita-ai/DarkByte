import type { PrismaClient } from "@prisma/client";

export async function syncMemoryEmbeddingVec(
  prisma: PrismaClient,
  entryId: string,
  embedding: number[],
): Promise<void> {
  if (embedding.length !== 384) return;
  const literal = `[${embedding.join(",")}]`;
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "MemoryEntry" SET "embeddingVec" = $1::vector WHERE "id" = $2`,
      literal,
      entryId,
    );
  } catch {
    /* pgvector extension or column missing until migration applied */
  }
}

export async function searchMemoryPgvector(
  prisma: PrismaClient,
  userId: string,
  queryEmbedding: number[],
  limit = 8,
): Promise<{ id: string; score: number }[]> {
  if (queryEmbedding.length !== 384) return [];
  const literal = `[${queryEmbedding.join(",")}]`;
  try {
    const rows = await prisma.$queryRawUnsafe<{ id: string; score: number }[]>(
      `SELECT "id",
              1 - ("embeddingVec" <=> $1::vector) AS score
       FROM "MemoryEntry"
       WHERE "userId" = $2 AND "embeddingVec" IS NOT NULL
       ORDER BY "embeddingVec" <=> $1::vector
       LIMIT $3`,
      literal,
      userId,
      limit,
    );
    return rows.filter((r) => r.score >= 0.28);
  } catch {
    return [];
  }
}