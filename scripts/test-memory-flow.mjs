/**
 * Memory flow smoke test (Python optional; uses HTTP auth + chat).
 */
import nextEnv from "@next/env";
import { requirePrisma } from "../src/lib/db.ts";
import { ingestChatTurn } from "../src/server/memory/ingest.ts";
import { buildMemoryAugmentedHistory } from "../src/server/memory/context.ts";

nextEnv.loadEnvConfig(process.cwd());
const prisma = requirePrisma();

const email = `mem-${Date.now()}@darkbyte.local`;
const password = "MemoryTest99!";
const base = (process.env.CREDITS_APP_URL || "http://localhost:3000").replace(/\/$/, "");

async function registerAndSignIn() {
  await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "MemTest", email, password }),
  });
  const jar = new Map();
  const csrfRes = await fetch(`${base}/api/auth/csrf`, { redirect: "manual" });
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];
  for (const c of cookies) {
    const nv = c.split(";")[0];
    const i = nv.indexOf("=");
    if (i > 0) jar.set(nv.slice(0, i), nv.slice(i + 1));
  }
  const { csrfToken } = await csrfRes.json();
  const signRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
  });
  for (const c of signRes.headers.getSetCookie?.() ?? []) {
    const nv = c.split(";")[0];
    const i = nv.indexOf("=");
    if (i > 0) jar.set(nv.slice(0, i), nv.slice(i + 1));
  }
  return jar;
}

const user = await prisma.user.create({
  data: { email: `mem-direct-${Date.now()}@darkbyte.local`, passwordHash: "x", emailVerified: new Date() },
});
await prisma.creditAccount.create({ data: { userId: user.id, balance: 50 } });
const conv = await prisma.conversation.create({
  data: { userId: user.id, title: "Memory test", modelId: "openai/gpt-oss-20b" },
});
const msg = await prisma.message.create({
  data: { conversationId: conv.id, role: "user", content: "My name is Nikita. Remember that I prefer Groq." },
});

await ingestChatTurn({
  prisma,
  userId: user.id,
  conversationId: conv.id,
  userMessageId: msg.id,
  userText: "My name is Nikita. Remember that I prefer Groq.",
  assistantText: "Got it — I'll remember you prefer Groq.",
  allMessages: [
    { role: "user", content: "My name is Nikita. Remember that I prefer Groq." },
    { role: "assistant", content: "Got it — I'll remember you prefer Groq." },
  ],
});

const conv2 = await prisma.conversation.create({
  data: { userId: user.id, title: "New chat", modelId: "openai/gpt-oss-20b" },
});
const history = await buildMemoryAugmentedHistory({
  prisma,
  userId: user.id,
  conversationId: conv2.id,
  shortTermMessages: [],
  latestUserMessage: "What model do I prefer?",
});
const system = history.find((h) => h.role === "system")?.content ?? "";
if (!/Groq|Nikita/i.test(system)) {
  console.error("Memory not injected:", system.slice(0, 400));
  process.exit(1);
}

const other = await prisma.user.create({
  data: { email: `mem-other-${Date.now()}@darkbyte.local`, passwordHash: "x", emailVerified: new Date() },
});
const leak = await buildMemoryAugmentedHistory({
  prisma,
  userId: other.id,
  conversationId: conv2.id,
  shortTermMessages: [],
  latestUserMessage: "What model do I prefer?",
});
const otherSystem = leak.find((h) => h.role === "system")?.content ?? "";
if (/Nikita/i.test(otherSystem)) {
  console.error("Cross-user memory leak");
  process.exit(1);
}

console.log("PASS memory-flow (isolation + context injection)");
await registerAndSignIn().catch(() => undefined);
await prisma.creditAccount.deleteMany({ where: { userId: { in: [user.id, other.id] } } }).catch(() => undefined);
await prisma.user.deleteMany({
  where: { id: { in: [user.id, other.id] } },
}).catch(() => undefined);