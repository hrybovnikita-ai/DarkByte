import type { PrismaClient } from "@prisma/client";
import type { ChatTurn } from "@/server/ai/providers";
import {
  loadConversationSummary,
  loadUserPreferences,
  retrieveRelevantMemories,
} from "@/server/memory/retrieve";
import { applyForgetPlan, parseForgetIntent } from "@/server/memory/forget";
import { redactSensitiveText } from "@/server/memory/redact";

const BASE_SYSTEM =
  "You are DARKBYTE AI, a helpful assistant inside the DARKBYTE horror-pixel universe. Be concise, creative, and safe. Use Markdown when helpful.";

const MEMORY_POLICY =
  "Use the user's memory context below when relevant. Never reveal other users' data. Never repeat or store passwords, API keys, or tokens.";

export async function buildMemoryAugmentedHistory(params: {
  prisma: PrismaClient;
  userId: string;
  conversationId: string;
  shortTermMessages: { role: string; content: string }[];
  latestUserMessage: string;
}): Promise<ChatTurn[]> {
  const userMessage = redactSensitiveText(params.latestUserMessage);

  const forget = parseForgetIntent(userMessage);
  if (forget.forgetAll || forget.phrases.length) {
    await applyForgetPlan(params.prisma, params.userId, forget);
  }

  const [memories, preferences, convoSummary, profile] = await Promise.all([
    retrieveRelevantMemories(params.prisma, params.userId, userMessage),
    loadUserPreferences(params.prisma, params.userId),
    loadConversationSummary(params.prisma, params.conversationId),
    params.prisma.userMemoryProfile.findUnique({
      where: { userId: params.userId },
      select: { narrative: true },
    }),
  ]);

  const memoryLines: string[] = [];
  if (profile?.narrative) {
    memoryLines.push(`User profile:\n${profile.narrative.slice(0, 600)}`);
  }
  if (preferences.length) {
    memoryLines.push(
      "Known preferences:\n" +
        preferences.map((p) => `- ${p.key}: ${p.value}`).join("\n"),
    );
  }
  if (convoSummary) {
    memoryLines.push(`This conversation so far:\n${convoSummary.slice(0, 700)}`);
  }
  if (memories.length) {
    memoryLines.push(
      "Relevant memories from past chats:\n" +
        memories.map((m, i) => `${i + 1}. (${m.kind}) ${m.content}`).join("\n"),
    );
  }

  const systemBlocks = [BASE_SYSTEM, MEMORY_POLICY];
  if (memoryLines.length) {
    systemBlocks.push(memoryLines.join("\n\n"));
  }

  const history: ChatTurn[] = [
    { role: "system", content: systemBlocks.join("\n\n") },
    ...params.shortTermMessages.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  return history;
}

export { BASE_SYSTEM as CHAT_BASE_SYSTEM_PROMPT };