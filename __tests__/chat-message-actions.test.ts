import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT as putFeedback } from "@/app/api/chat/messages/[id]/feedback/route";
import { POST as branchConversationRoute } from "@/app/api/chat/conversations/[id]/branch/route";
import { POST as createShareRoute } from "@/app/api/chat/conversations/[id]/share/route";
import { GET as getSharedRoute } from "@/app/api/chat/shared/[token]/route";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    message: { findUnique: vi.fn() },
    messageFeedback: { upsert: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn() },
    messageDeleteMany: vi.fn(),
    $transaction: vi.fn(),
    conversationShare: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("@/server/auth/context", () => ({ getAuthUser: mocks.auth }));
vi.mock("@/lib/db", () => ({
  requirePrisma: () => ({
    message: mocks.db.message,
    messageFeedback: mocks.db.messageFeedback,
    conversation: mocks.db.conversation,
    $transaction: mocks.db.$transaction,
    conversationShare: mocks.db.conversationShare,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ id: "user-a", role: "USER" });
});

describe("message feedback", () => {
  it("stores feedback for owned assistant messages", async () => {
    mocks.db.message.findUnique.mockResolvedValue({
      id: "msg-1",
      role: "assistant",
      conversation: { userId: "user-a" },
    });
    mocks.db.messageFeedback.upsert.mockResolvedValue({ rating: "GOOD", updatedAt: new Date() });
    const response = await putFeedback(
      new Request("http://localhost/api/chat/messages/msg-1/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: "GOOD" }),
      }),
      { params: Promise.resolve({ id: "msg-1" }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.db.messageFeedback.upsert).toHaveBeenCalled();
  });

  it("rejects feedback from non-owners", async () => {
    mocks.db.message.findUnique.mockResolvedValue({
      id: "msg-1",
      role: "assistant",
      conversation: { userId: "other" },
    });
    const response = await putFeedback(
      new Request("http://localhost/api/chat/messages/msg-1/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: "BAD" }),
      }),
      { params: Promise.resolve({ id: "msg-1" }) },
    );
    expect(response.status).toBe(403);
  });
});

describe("conversation share", () => {
  it("requires explicit confirmation", async () => {
    const response = await createShareRoute(
      new Request("http://localhost/api/chat/conversations/conv-1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: false }),
      }),
      { params: Promise.resolve({ id: "conv-1" }) },
    );
    expect(response.status).toBe(400);
  });

  it("creates share links for owners", async () => {
    mocks.db.conversation.findUnique.mockResolvedValue({ id: "conv-1", userId: "user-a" });
    mocks.db.conversationShare.create.mockResolvedValue({
      id: "share-1",
      token: "abc",
      expiresAt: new Date(),
      createdAt: new Date(),
    });
    const response = await createShareRoute(
      new Request("http://localhost/api/chat/conversations/conv-1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      }),
      { params: Promise.resolve({ id: "conv-1" }) },
    );
    expect(response.status).toBe(201);
    expect(mocks.db.conversationShare.create).toHaveBeenCalled();
  });

  it("serves shared conversations without auth", async () => {
    mocks.db.conversationShare.findUnique.mockResolvedValue({
      token: "tok",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      conversation: {
        title: "Shared",
        modelId: "openai/gpt-oss-20b",
        messages: [{ id: "m1", role: "assistant", content: "Hi", modelId: null, createdAt: new Date() }],
      },
    });
    const response = await getSharedRoute(new Request("http://localhost/api/chat/shared/tok"), {
      params: Promise.resolve({ token: "tok" }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.messages).toHaveLength(1);
  });
});

describe("branch conversation", () => {
  it("branches at an assistant reply", async () => {
    const messages = [
      { id: "u1", role: "user", content: "Hi", modelId: null, createdAt: new Date("2024-01-01") },
      { id: "a1", role: "assistant", content: "Hello", modelId: "m1", createdAt: new Date("2024-01-02") },
    ];
    mocks.db.conversation.findUnique.mockResolvedValue({
      id: "conv-1",
      userId: "user-a",
      title: "Main",
      modelId: "m1",
      messages,
    });
    mocks.db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        conversation: { create: vi.fn().mockResolvedValue({ id: "conv-2", title: "Branch: Main", modelId: "m1", updatedAt: new Date(), createdAt: new Date() }) },
        message: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
      };
      return fn(tx);
    });
    const response = await branchConversationRoute(
      new Request("http://localhost/api/chat/conversations/conv-1/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromMessageId: "a1" }),
      }),
      { params: Promise.resolve({ id: "conv-1" }) },
    );
    expect(response.status).toBe(201);
  });
});