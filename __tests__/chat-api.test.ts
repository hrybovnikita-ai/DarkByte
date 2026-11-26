import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listConversations, POST as createConversation } from "@/app/api/chat/conversations/route";
import { GET as getConversation, PATCH as patchConversation, DELETE as deleteConversation } from "@/app/api/chat/conversations/[id]/route";
import { GET as listModels } from "@/app/api/chat/models/route";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    conversation: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    message: { create: vi.fn() },
    creditAccount: { findUnique: vi.fn() },
  },
}));

vi.mock("@/server/auth/context", () => ({ getAuthUser: mocks.auth }));
vi.mock("@/lib/db", () => ({ requirePrisma: () => mocks.db }));
vi.mock("@/server/ai/discover", () => ({
  resolveAvailableModels: vi.fn().mockResolvedValue([{
    id: "gemini-3.8-flash", label: "Google · Gemini 3.8 Flash", provider: "gemini", creditCost: 3,
  }]),
  findResolvedModel: vi.fn((id: string, models: { id: string }[]) => models.find((m) => m.id === id)),
}));

const context = { params: Promise.resolve({ id: "conv-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GEMINI_API_KEY", "test-gemini");
  mocks.auth.mockResolvedValue({ id: "user-a", role: "USER" });
  mocks.db.conversation.findMany.mockResolvedValue([]);
  mocks.db.conversation.create.mockResolvedValue({ id: "conv-1", title: "New conversation", modelId: "gemini-3.8-flash", pinnedAt: null, updatedAt: new Date(), createdAt: new Date() });
  mocks.db.conversation.findUnique.mockResolvedValue({ id: "conv-1", userId: "user-a", title: "Test", modelId: "gemini-3.8-flash", messages: [] });
  mocks.db.conversation.update.mockResolvedValue({ id: "conv-1", title: "Renamed", modelId: "gemini-3.8-flash", pinnedAt: new Date(), updatedAt: new Date(), createdAt: new Date() });
});

describe("chat API authorization", () => {
  it("requires authentication", async () => {
    mocks.auth.mockRejectedValue(new Error("UNAUTHORIZED"));
    expect((await listConversations(new Request("http://localhost/api/chat/conversations"), context)).status).toBe(401);
    expect((await listModels(new Request("http://localhost/api/chat/models"), context)).status).toBe(401);
  });

  it("scopes conversation reads to the owner", async () => {
    mocks.db.conversation.findUnique.mockResolvedValue({ id: "conv-1", userId: "other", title: "X", modelId: "gemini-3.8-flash", messages: [] });
    expect((await getConversation(new Request("http://localhost/api/chat/conversations/conv-1"), context)).status).toBe(403);
  });

  it("creates and renames conversations for the authenticated user", async () => {
    expect((await createConversation(new Request("http://localhost/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Horror prompt" }),
    }), context)).status).toBe(201);
    expect(mocks.db.conversation.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "user-a" }) }));

    const patch = new Request("http://localhost/api/chat/conversations/conv-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Renamed" }),
    });
    expect((await patchConversation(patch, context)).status).toBe(200);

    const pin = new Request("http://localhost/api/chat/conversations/conv-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: true }),
    });
    expect((await patchConversation(pin, context)).status).toBe(200);
    expect(mocks.db.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pinnedAt: expect.any(Date) }) }),
    );
  });

  it("deletes owned conversations", async () => {
    const response = await deleteConversation(new Request("http://localhost/api/chat/conversations/conv-1", { method: "DELETE" }), context);
    expect(response.status).toBe(204);
    expect(mocks.db.conversation.delete).toHaveBeenCalledWith({ where: { id: "conv-1" } });
  });
});