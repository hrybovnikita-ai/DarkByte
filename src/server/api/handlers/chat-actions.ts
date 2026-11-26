import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import { findResolvedModel, resolveAvailableModels } from "@/server/ai/discover";
import { getAuthUser } from "@/server/auth/context";
import { apiCreated, apiError, apiSuccess, handleRouteError } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { checkRateLimitAsync } from "@/server/middleware/rate-limit";
import { spendCredits } from "@/server/credits/ledger";
import { AiProviderError, streamModel, type ChatTurn } from "@/server/ai/providers";
import { buildMemoryAugmentedHistory } from "@/server/memory/context";
import { ingestChatTurn } from "@/server/memory/ingest";

const feedbackSchema = z.object({ rating: z.enum(["GOOD", "BAD"]) }).strict();
const regenerateSchema = z.object({
  assistantMessageId: z.string().min(1),
  modelId: z.string().min(1).max(80).optional(),
}).strict();
const branchSchema = z.object({ fromMessageId: z.string().min(1) }).strict();
const shareCreateSchema = z.object({ confirm: z.literal(true) }).strict();

const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function assertOwner(userId: string, ownerId: string) {
  if (userId !== ownerId) throw new Error("FORBIDDEN");
}

function privateJson<T>(data: T, status = 200) {
  const response = apiSuccess(data, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function availableModels() {
  try {
    return await resolveAvailableModels();
  } catch {
    return [];
  }
}

export async function upsertMessageFeedback(request: Request, messageId: string) {
  const user = await getAuthUser(request, { required: true });
  const body = feedbackSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { select: { userId: true } } },
  });
  if (!message) throw new Error("NOT_FOUND");
  assertOwner(user.id, message.conversation.userId);
  if (message.role !== "assistant") return apiError("Feedback applies to assistant messages only", 400, "INVALID_MESSAGE");
  const row = await prisma.messageFeedback.upsert({
    where: { messageId_userId: { messageId, userId: user.id } },
    create: { messageId, userId: user.id, rating: body.rating },
    update: { rating: body.rating },
    select: { rating: true, updatedAt: true },
  });
  return privateJson({ rating: row.rating, updatedAt: row.updatedAt.toISOString() });
}

export async function branchConversation(request: Request, conversationId: string) {
  const user = await getAuthUser(request, { required: true });
  const body = branchSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();
  const source = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!source) throw new Error("NOT_FOUND");
  assertOwner(user.id, source.userId);

  const pivot = source.messages.find((m) => m.id === body.fromMessageId);
  if (!pivot) return apiError("Message not found in conversation", 404, "MESSAGE_NOT_FOUND");
  if (pivot.role !== "assistant") return apiError("Branch from an assistant reply", 400, "INVALID_MESSAGE");

  const slice = source.messages.filter((m) => m.createdAt <= pivot.createdAt);
  const titleBase = source.title?.trim() || "Conversation";
  const branchTitle = `Branch: ${titleBase}`.slice(0, 120);

  const created = await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        userId: user.id,
        title: branchTitle,
        modelId: pivot.modelId ?? source.modelId,
        branchedFromId: source.id,
        branchedFromMessageId: pivot.id,
      },
    });
    if (slice.length > 0) {
      await tx.message.createMany({
        data: slice.map((m) => ({
          conversationId: conversation.id,
          role: m.role,
          content: m.content,
          modelId: m.modelId,
          createdAt: m.createdAt,
        })),
      });
    }
    return conversation;
  });

  return apiCreated({
    id: created.id,
    title: created.title,
    modelId: created.modelId,
    updatedAt: created.updatedAt,
    createdAt: created.createdAt,
    messageCount: slice.length,
  });
}

export async function createConversationShare(request: Request, conversationId: string) {
  const user = await getAuthUser(request, { required: true });
  const body = shareCreateSchema.parse(await readJsonBody(request));
  if (!body.confirm) return apiError("Explicit confirmation required", 400, "CONFIRM_REQUIRED");

  const prisma = requirePrisma();
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new Error("NOT_FOUND");
  assertOwner(user.id, conversation.userId);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SHARE_TTL_MS);
  const share = await prisma.conversationShare.create({
    data: {
      conversationId,
      token,
      createdById: user.id,
      expiresAt,
    },
    select: { id: true, token: true, expiresAt: true, createdAt: true },
  });

  const origin = new URL(request.url).origin;
  return apiCreated({
    shareId: share.id,
    token: share.token,
    url: `${origin}/chat/shared/${share.token}`,
    expiresAt: share.expiresAt?.toISOString() ?? null,
    createdAt: share.createdAt.toISOString(),
  });
}

export async function revokeConversationShare(request: Request, conversationId: string, shareId: string) {
  const user = await getAuthUser(request, { required: true });
  const prisma = requirePrisma();
  const share = await prisma.conversationShare.findUnique({
    where: { id: shareId },
    include: { conversation: { select: { id: true, userId: true } } },
  });
  if (!share || share.conversation.id !== conversationId) throw new Error("NOT_FOUND");
  assertOwner(user.id, share.conversation.userId);
  if (share.revokedAt) return privateJson({ revoked: true, revokedAt: share.revokedAt.toISOString() });
  const updated = await prisma.conversationShare.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
    select: { revokedAt: true },
  });
  return privateJson({ revoked: true, revokedAt: updated.revokedAt?.toISOString() ?? null });
}

export async function listConversationShares(request: Request, conversationId: string) {
  const user = await getAuthUser(request, { required: true });
  const prisma = requirePrisma();
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new Error("NOT_FOUND");
  assertOwner(user.id, conversation.userId);

  const items = await prisma.conversationShare.findMany({
    where: { conversationId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, expiresAt: true, createdAt: true, revokedAt: true },
  });
  const origin = new URL(request.url).origin;
  return privateJson({
    items: items.map((s) => ({
      id: s.id,
      url: `${origin}/chat/shared/${s.token}`,
      expiresAt: s.expiresAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      active: !s.revokedAt && (!s.expiresAt || s.expiresAt > new Date()),
    })),
  });
}

export async function getSharedConversation(_request: Request, token: string) {
  const prisma = requirePrisma();
  const share = await prisma.conversationShare.findUnique({
    where: { token },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, content: true, modelId: true, createdAt: true },
          },
        },
      },
    },
  });
  if (!share || share.revokedAt) return apiError("Share link not found or revoked", 404, "SHARE_NOT_FOUND");
  if (share.expiresAt && share.expiresAt < new Date()) {
    return apiError("Share link expired", 410, "SHARE_EXPIRED");
  }
  const response = apiSuccess({
    title: share.conversation.title,
    modelId: share.conversation.modelId,
    sharedAt: share.createdAt.toISOString(),
    expiresAt: share.expiresAt?.toISOString() ?? null,
    messages: share.conversation.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function regenerateAssistantMessage(request: Request, conversationId: string) {
  const rate = await checkRateLimitAsync(request, "chat-stream");
  if (!rate.allowed) {
    const response = apiError("Too many requests", 429, "RATE_LIMIT", { retryAfter: rate.retryAfter });
    if (rate.retryAfter) response.headers.set("Retry-After", String(rate.retryAfter));
    return response;
  }

  const user = await getAuthUser(request, { required: true });
  const body = regenerateSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new Error("NOT_FOUND");
  assertOwner(user.id, conversation.userId);

  const assistantIndex = conversation.messages.findIndex((m) => m.id === body.assistantMessageId);
  if (assistantIndex < 0) return apiError("Message not found", 404, "MESSAGE_NOT_FOUND");
  const assistantMsg = conversation.messages[assistantIndex];
  if (assistantMsg.role !== "assistant") return apiError("Regenerate an assistant reply", 400, "INVALID_MESSAGE");

  const prior = conversation.messages.slice(0, assistantIndex);
  const lastUser = [...prior].reverse().find((m) => m.role === "user");
  if (!lastUser) return apiError("No user message to regenerate from", 400, "INVALID_STATE");

  const models = await availableModels();
  const modelId = body.modelId ?? assistantMsg.modelId ?? conversation.modelId;
  const model = findResolvedModel(modelId, models);
  if (!model) return apiError("Unknown or unavailable model", 400, "INVALID_MODEL");

  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const balance = account?.balance ?? 0;
  if (balance < model.creditCost) {
    return apiError("Not enough credits for this model", 402, "INSUFFICIENT_CREDITS", { required: model.creditCost, balance });
  }

  const toRemove = conversation.messages.slice(assistantIndex);
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { id: { in: toRemove.map((m) => m.id) } } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { modelId, updatedAt: new Date() } }),
  ]);

  const shortTerm = prior.map((m) => ({ role: m.role, content: m.content }));

  let history: ChatTurn[];
  try {
    history = await buildMemoryAugmentedHistory({
      prisma,
      userId: user.id,
      conversationId,
      shortTermMessages: shortTerm,
      latestUserMessage: lastUser.content,
    });
  } catch {
    history = [
      {
        role: "system",
        content:
          "You are DARKBYTE AI, a helpful assistant inside the DARKBYTE horror-pixel universe. Be concise, creative, and safe. Use Markdown when helpful.",
      },
      ...shortTerm.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ];
  }

  const encoder = new TextEncoder();
  let assistantText = "";
  let failed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));
      send("replace", { fromMessageId: body.assistantMessageId });
      try {
        await streamModel(model, history, (delta) => {
          assistantText += delta;
          send("token", { t: delta });
        }, request.signal);
        if (!assistantText.trim()) throw new AiProviderError("Empty AI response", "UPSTREAM");
        const assistant = await prisma.message.create({
          data: { conversationId, role: "assistant", content: assistantText, modelId: model.id },
        });
        await spendCredits(user.id, model.creditCost, `chat:${assistant.id}`, `${model.label} chat retry`, prisma);
        const allMessages = [
          ...shortTerm,
          { role: "user", content: lastUser.content },
          { role: "assistant", content: assistantText },
        ];
        void ingestChatTurn({
          prisma,
          userId: user.id,
          conversationId,
          userMessageId: lastUser.id,
          userText: lastUser.content,
          assistantText,
          allMessages,
        }).catch(() => undefined);
        send("done", {
          assistantId: assistant.id,
          creditsCharged: model.creditCost,
          balanceHint: balance - model.creditCost,
        });
      } catch (error) {
        failed = true;
        if (error instanceof AiProviderError) {
          send("error", { message: error.message, code: error.code });
        } else if (error instanceof Error && error.name === "AbortError") {
          send("error", { message: "Generation stopped", code: "ABORTED" });
        } else if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
          send("error", { message: "Could not charge credits", code: "INSUFFICIENT_CREDITS" });
        } else {
          send("error", { message: "AI request failed", code: "INTERNAL_ERROR" });
        }
      } finally {
        if (failed) controller.enqueue(encoder.encode(sse("end", { charged: false })));
        else controller.enqueue(encoder.encode(sse("end", { charged: true })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function safeRegenerateAssistantMessage(request: Request, conversationId: string) {
  try {
    return await regenerateAssistantMessage(request, conversationId);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return apiError(error.message, error.status, error.code);
    }
    return handleRouteError(error);
  }
}

export async function safeUpsertMessageFeedback(request: Request, messageId: string) {
  try {
    return await upsertMessageFeedback(request, messageId);
  } catch (error) {
    return handleRouteError(error);
  }
}