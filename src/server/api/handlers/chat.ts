import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import { AI_MODELS } from "@/lib/ai-models";
import { resolveAvailableModels, findResolvedModel } from "@/server/ai/discover";
import { getAuthUser } from "@/server/auth/context";
import { apiCreated, apiNoContent, apiSuccess, apiError, handleRouteError } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { checkRateLimit } from "@/server/middleware/rate-limit";
import { spendCredits } from "@/server/credits/ledger";
import { AiProviderError, streamModel, type ChatTurn } from "@/server/ai/providers";
import { buildMemoryAugmentedHistory } from "@/server/memory/context";
import { ingestChatTurn } from "@/server/memory/ingest";

const createConversationSchema = z.object({ title: z.string().trim().min(1).max(120).optional(), modelId: z.string().min(1).max(80).optional() }).strict();
const patchConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  modelId: z.string().min(1).max(80).optional(),
}).strict();
const streamSchema = z.object({ content: z.string().trim().min(1).max(16000), modelId: z.string().min(1).max(80).optional() }).strict();

function assertOwner(userId: string, ownerId: string) {
  if (userId !== ownerId) throw new Error("FORBIDDEN");
}

function privateJson<T>(data: T, status = 200) {
  const response = apiSuccess(data, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function availableModels() {
  try {
    return await resolveAvailableModels();
  } catch {
    return [];
  }
}

export async function listChatModels(request: Request) {
  await getAuthUser(request, { required: true });
  const configured = await availableModels();
  const configuredIds = new Set(configured.map((m) => m.id));
  return privateJson({
    models: AI_MODELS.filter((m) => configuredIds.has(m.id)).map((m) => ({
      id: m.id,
      label: m.label,
      provider: m.provider,
      creditCost: m.creditCost,
      configured: true,
    })),
  });
}

export async function listConversations(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const search = new URL(request.url).searchParams.get("search")?.trim();
  const items = await requirePrisma().conversation.findMany({
    where: {
      userId: user.id,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, title: true, modelId: true, updatedAt: true, createdAt: true },
  });
  return privateJson({ items });
}

export async function createConversation(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const body = createConversationSchema.parse(await readJsonBody(request));
  const models = await availableModels();
  const model = findResolvedModel(body.modelId ?? "", models) ?? models[0];
  if (!model) return apiError("No AI models are available. Check server API keys.", 503, "AI_NOT_CONFIGURED");
  const created = await requirePrisma().conversation.create({
    data: {
      userId: user.id,
      title: body.title ?? "New conversation",
      modelId: model.id,
    },
    select: { id: true, title: true, modelId: true, updatedAt: true, createdAt: true },
  });
  return apiCreated(created);
}

export async function getConversation(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const row = await requirePrisma().conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, modelId: true, createdAt: true } },
    },
  });
  if (!row) throw new Error("NOT_FOUND");
  assertOwner(user.id, row.userId);
  return privateJson({
    id: row.id,
    title: row.title,
    modelId: row.modelId,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    messages: row.messages,
  });
}

export async function patchConversation(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const body = patchConversationSchema.parse(await readJsonBody(request));
  const models = await availableModels();
  if (body.modelId && !findResolvedModel(body.modelId, models)) return apiError("Unknown or unavailable model", 400, "INVALID_MODEL");
  const existing = await requirePrisma().conversation.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  assertOwner(user.id, existing.userId);
  const updated = await requirePrisma().conversation.update({
    where: { id },
    data: {
      ...(body.title ? { title: body.title } : {}),
      ...(body.modelId ? { modelId: body.modelId } : {}),
    },
    select: { id: true, title: true, modelId: true, updatedAt: true, createdAt: true },
  });
  return privateJson(updated);
}

export async function deleteConversation(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const existing = await requirePrisma().conversation.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  assertOwner(user.id, existing.userId);
  await requirePrisma().conversation.delete({ where: { id } });
  return apiNoContent();
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function streamConversationMessage(request: Request, id: string) {
  const rate = checkRateLimit(request, "chat-stream");
  if (!rate.allowed) {
    const response = apiError("Too many requests", 429, "RATE_LIMIT", { retryAfter: rate.retryAfter });
    if (rate.retryAfter) response.headers.set("Retry-After", String(rate.retryAfter));
    return response;
  }
  const user = await getAuthUser(request, { required: true });
  const body = streamSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40, select: { role: true, content: true } } },
  });
  if (!conversation) throw new Error("NOT_FOUND");
  assertOwner(user.id, conversation.userId);

  const models = await availableModels();
  const modelId = body.modelId ?? conversation.modelId;
  const model = findResolvedModel(modelId, models);
  if (!model) return apiError("Unknown or unavailable model", 400, "INVALID_MODEL");

  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const balance = account?.balance ?? 0;
  if (balance < model.creditCost) {
    return apiError("Not enough credits for this model", 402, "INSUFFICIENT_CREDITS", { required: model.creditCost, balance });
  }

  const userMessage = await prisma.message.create({
    data: { conversationId: id, role: "user", content: body.content },
  });

  const title = conversation.title?.trim();
  if (!title || title === "New conversation") {
    const slice = body.content.slice(0, 72).trim();
    if (slice) {
      await prisma.conversation.update({ where: { id }, data: { title: slice, modelId, updatedAt: new Date() } });
    }
  } else if (conversation.modelId !== modelId) {
    await prisma.conversation.update({ where: { id }, data: { modelId, updatedAt: new Date() } });
  } else {
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  let history: ChatTurn[];
  try {
    history = await buildMemoryAugmentedHistory({
      prisma,
      userId: user.id,
      conversationId: id,
      shortTermMessages: conversation.messages,
      latestUserMessage: body.content,
    });
  } catch {
    history = [
      {
        role: "system",
        content:
          "You are DARKBYTE AI, a helpful assistant inside the DARKBYTE horror-pixel universe. Be concise, creative, and safe. Use Markdown when helpful.",
      },
      ...conversation.messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user", content: body.content },
    ];
  }

  const encoder = new TextEncoder();
  let assistantText = "";
  let failed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));
      send("user", { id: userMessage.id });
      try {
        await streamModel(model, history, (delta) => {
          assistantText += delta;
          send("token", { t: delta });
        }, request.signal);
        if (!assistantText.trim()) throw new AiProviderError("Empty AI response", "UPSTREAM");
        const assistant = await prisma.message.create({
          data: { conversationId: id, role: "assistant", content: assistantText, modelId: model.id },
        });
        await spendCredits(user.id, model.creditCost, `chat:${assistant.id}`, `${model.label} chat reply`, prisma);
        const allMessages = [
          ...conversation.messages,
          { role: "user", content: body.content },
          { role: "assistant", content: assistantText },
        ];
        void ingestChatTurn({
          prisma,
          userId: user.id,
          conversationId: id,
          userMessageId: userMessage.id,
          userText: body.content,
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

export async function safeStreamConversationMessage(request: Request, id: string) {
  try {
    return await streamConversationMessage(request, id);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return apiError(error.message, error.status, error.code);
    }
    return handleRouteError(error);
  }
}