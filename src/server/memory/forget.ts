import type { PrismaClient } from "@prisma/client";
import { runMemoryPython } from "@/server/memory/python-bridge";
import { embedTexts } from "@/server/memory/embeddings";
import { cosineSimilarity } from "@/server/memory/fallback-embed";

const FORGET_ALL_RE = /\b(?:forget everything|delete all my memories|clear my memory)\b/i;
const FORGET_RE = /\b(?:forget(?: about)?|delete(?: from)? memory|remove from memory)\s+(.{2,200})/gi;

export type ForgetPlan = {
  forgetAll: boolean;
  phrases: string[];
};

export function parseForgetIntent(message: string): ForgetPlan {
  const forgetAll = FORGET_ALL_RE.test(message);
  const phrases: string[] = [];
  if (!forgetAll) {
    let match: RegExpExecArray | null;
    const re = new RegExp(FORGET_RE.source, FORGET_RE.flags);
    while ((match = re.exec(message)) !== null) {
      phrases.push(match[1]!.trim().replace(/\.$/, ""));
    }
  }
  return { forgetAll, phrases };
}

export async function applyForgetPlan(
  prisma: PrismaClient,
  userId: string,
  plan: ForgetPlan,
): Promise<{ deleted: number }> {
  if (plan.forgetAll) {
    const result = await prisma.memoryEntry.deleteMany({ where: { userId } });
    await prisma.userPreference.deleteMany({ where: { userId } });
    await prisma.userMemoryProfile.deleteMany({ where: { userId } });
    return { deleted: result.count };
  }
  if (!plan.phrases.length) return { deleted: 0 };

  const entries = await prisma.memoryEntry.findMany({
    where: { userId },
    select: { id: true, content: true, embedding: true },
    take: 400,
  });
  const toDelete = new Set<string>();

  for (const phrase of plan.phrases) {
    const lower = phrase.toLowerCase();
    for (const row of entries) {
      if (row.content.toLowerCase().includes(lower)) toDelete.add(row.id);
    }
    const [qVec] = await embedTexts([phrase]);
    if (qVec) {
      for (const row of entries) {
        const emb = row.embedding as number[] | null;
        if (emb?.length && cosineSimilarity(qVec, emb) >= 0.55) toDelete.add(row.id);
      }
    }
  }

  if (!toDelete.size) return { deleted: 0 };
  const result = await prisma.memoryEntry.deleteMany({
    where: { userId, id: { in: [...toDelete] } },
  });
  return { deleted: result.count };
}

export async function extractForgetFromTurn(user: string, assistant: string): Promise<ForgetPlan> {
  const fromRules = parseForgetIntent(user);
  if (fromRules.forgetAll || fromRules.phrases.length) return fromRules;
  const extracted = await runMemoryPython<ForgetPlan & { forget_phrases?: string[]; forget_all?: boolean }>(
    "extract",
    { user, assistant },
  );
  if (!extracted) return { forgetAll: false, phrases: [] };
  return {
    forgetAll: Boolean(extracted.forget_all),
    phrases: extracted.forget_phrases ?? extracted.phrases ?? [],
  };
}