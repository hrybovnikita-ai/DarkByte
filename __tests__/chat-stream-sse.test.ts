import { describe, expect, it, vi } from "vitest";
import { streamConversationMessage } from "@/server/api/handlers/chat";

vi.mock("@/server/auth/context", () => ({
  getAuthUser: vi.fn().mockResolvedValue({ id: "user-a", role: "USER" }),
}));
vi.mock("@/server/ai/discover", () => ({
  resolveAvailableModels: vi.fn().mockResolvedValue([
    { id: "openai/gpt-oss-20b", label: "Groq", provider: "groq", creditCost: 1 },
  ]),
  findResolvedModel: vi.fn((id: string, models: { id: string }[]) => models.find((m) => m.id === id)),
}));
vi.mock("@/server/credits/ledger", () => ({
  spendCredits: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/server/memory/context", () => ({
  buildMemoryAugmentedHistory: vi.fn(async ({ shortTermMessages, latestUserMessage }) => [
    { role: "system", content: "test" },
    ...shortTermMessages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: latestUserMessage },
  ]),
}));
vi.mock("@/server/memory/ingest", () => ({
  ingestChatTurn: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/server/ai/providers", () => ({
  streamModel: vi.fn(async (_model, _history, onDelta) => {
    onDelta("Hello ");
    onDelta("from ");
    onDelta("DARKBYTE");
  }),
  AiProviderError: class AiProviderError extends Error {},
}));

const db = {
  conversation: {
    findUnique: vi.fn().mockResolvedValue({
      id: "conv-1",
      userId: "user-a",
      title: "Test",
      modelId: "openai/gpt-oss-20b",
      messages: [],
    }),
    update: vi.fn().mockResolvedValue({}),
  },
  message: {
    create: vi.fn()
      .mockResolvedValueOnce({ id: "msg-user-1" })
      .mockResolvedValueOnce({ id: "msg-asst-1" }),
  },
  creditAccount: { findUnique: vi.fn().mockResolvedValue({ userId: "user-a", balance: 100 }) },
};
vi.mock("@/lib/db", () => ({ requirePrisma: () => db }));

describe("chat SSE stream", () => {
  it("emits token events and completes with assistant text", async () => {
    const request = new Request("http://localhost/api/chat/conversations/conv-1/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Hello", modelId: "openai/gpt-oss-20b" }),
    });
    const response = await streamConversationMessage(request, "conv-1");
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("event: token");
    expect(text).toContain("Hello");
    expect(text).toContain("event: done");
    expect(text).toContain("msg-asst-1");
    expect(db.message.create).toHaveBeenCalledTimes(2);
  });
});