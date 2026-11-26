import type { MemoryKind, PrismaClient } from "@prisma/client";
import { embedTexts } from "@/server/memory/embeddings";
import { memoryContentHash } from "@/server/memory/hash";
import { syncMemoryEmbeddingVec } from "@/server/memory/pgvector";
import { runMemoryPython } from "@/server/memory/python-bridge";
import { redactSensitiveText } from "@/server/memory/redact";
import { cosineSimilarity } from "@/server/memory/fallback-embed";
import { applyForgetPlan, extractForgetFromTurn } from "@/server/memory/forget";

const DEDUP_SIMILARITY = 0.92;

type ExtractedFact = { kind: string; content: string; importance?: number };
type ExtractedPref = { key: string; value: string };

export async function ingestChatTurn(params: {
  prisma: PrismaClient;
  userId: string;
  conversationId: string;
  userMessageId: string;
  userText: string;
  assistantText: string;
  allMessages: { role: string; content: string }[];
}): Promise<void> {
  const user = redactSensitiveText(params.userText);
  const assistant = redactSensitiveText(params.assistantText);
  if (!user.trim() || !assistant.trim()) return;

  const forget = await extractForgetFromTurn(user, assistant);
  if (forget.forgetAll || forget.phrases.length) {
    await applyForgetPlan(params.prisma, params.userId, forget);
  }

  const extracted = await runMemoryPython<{
    facts: ExtractedFact[];
    preferences: ExtractedPref[];
  }>("extract", { user, assistant });

  const facts = extracted?.facts ?? [];
  const preferences = extracted?.preferences ?? [];

  for (const pref of preferences) {
    const key = pref.key.slice(0, 80);
    const value = pref.value.slice(0, 500);
    if (!key || !value) continue;
    await params.prisma.userPreference.upsert({
      where: { userId_key: { userId: params.userId, key } },
      create: {
        userId: params.userId,
        key,
        value,
        sourceConversationId: params.conversationId,
      },
      update: { value, confidence: 0.8, updatedAt: new Date() },
    });
  }

  const toStore: ExtractedFact[] = [
    ...facts,
    {
      kind: "EPISODE",
      content: `User said: ${user.slice(0, 220)}`,
      importance: 0.4,
    },
  ];

  const contents = toStore.map((f) => f.content.trim()).filter(Boolean);
  const embeddings = await embedTexts(contents);

  for (let i = 0; i < toStore.length; i += 1) {
    const fact = toStore[i]!;
    const content = contents[i]!;
    const embedding = embeddings[i];
    if (!content || !embedding) continue;

    const hash = memoryContentHash(content);
    const existingHash = await params.prisma.memoryEntry.findFirst({
      where: { userId: params.userId, contentHash: hash },
      select: { id: true },
    });
    if (existingHash) continue;

    const neighbors = await params.prisma.memoryEntry.findMany({
      where: { userId: params.userId },
      select: { id: true, embedding: true },
      take: 80,
      orderBy: { updatedAt: "desc" },
    });
    let duplicate = false;
    for (const n of neighbors) {
      const vec = n.embedding as number[] | null;
      if (vec?.length && cosineSimilarity(vec, embedding) >= DEDUP_SIMILARITY) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) continue;

    const kind = (["FACT", "PREFERENCE", "EPISODE"].includes(fact.kind)
      ? fact.kind
      : "FACT") as MemoryKind;

    const created = await params.prisma.memoryEntry.create({
      data: {
        userId: params.userId,
        kind,
        content: content.slice(0, 2000),
        contentHash: hash,
        importance: Math.min(1, Math.max(0.1, fact.importance ?? 0.5)),
        embedding,
        sourceConversationId: params.conversationId,
        sourceMessageId: params.userMessageId,
      },
      select: { id: true },
    });
    await syncMemoryEmbeddingVec(params.prisma, created.id, embedding);
  }

  const summaryResult = await runMemoryPython<{ summary: string }>("summarize", {
    messages: params.allMessages.map((m) => ({ role: m.role, content: m.content.slice(0, 800) })),
  });
  const summary = summaryResult?.summary?.trim() ?? "";
  const messageCount = params.allMessages.length;

  await params.prisma.conversationMemory.upsert({
    where: { conversationId: params.conversationId },
    create: {
      conversationId: params.conversationId,
      summary: summary || null,
      messageCount,
      updatedAt: new Date(),
    },
    update: { summary: summary || undefined, messageCount, updatedAt: new Date() },
  });

  if (preferences.length || facts.length) {
    const narrativeParts = [
      ...preferences.map((p) => `${p.key}: ${p.value}`),
      ...facts.map((f) => f.content),
    ].slice(0, 12);
    if (narrativeParts.length) {
      await params.prisma.userMemoryProfile.upsert({
        where: { userId: params.userId },
        create: {
          userId: params.userId,
          narrative: narrativeParts.join("\n"),
          updatedAt: new Date(),
        },
        update: {
          narrative: narrativeParts.join("\n"),
          updatedAt: new Date(),
        },
      });
    }
  }
}