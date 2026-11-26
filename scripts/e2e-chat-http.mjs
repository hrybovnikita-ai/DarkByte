/**
 * End-to-end: register → sign-in → chat stream (same path as the browser UI).
 * Requires dev server on CREDITS_APP_URL or http://localhost:3000
 */
const base = (process.env.CREDITS_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const password = "E2eChatPass99!";
const email = `e2e-${Date.now()}@darkbyte.local`;
const modelId = "openai/gpt-oss-20b";

function mergeCookies(jar, response) {
  const raw = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (response.headers.get("set-cookie")?.split(/,(?=\s*\w+=)/) ?? []);
  for (const part of raw) {
    const nv = part.split(";")[0].trim();
    const eq = nv.indexOf("=");
    if (eq < 0) continue;
    const name = nv.slice(0, eq);
    jar.set(name, nv.slice(eq + 1));
  }
}
function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function register() {
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "E2E", email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`register ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function signIn(jar) {
  const csrfRes = await fetch(`${base}/api/auth/csrf`, { redirect: "manual" });
  mergeCookies(jar, csrfRes);
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: "true",
    }),
  });
  mergeCookies(jar, res);
  if (res.status !== 200 && res.status !== 302) {
    const t = await res.text();
    throw new Error(`sign-in ${res.status}: ${t.slice(0, 300)}`);
  }
}

async function jsonAuthed(jar, path, init) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Cookie: cookieHeader(jar),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const text = await res.text();
  if (res.status === 429) {
    throw new Error(`429 ${path} Retry-After=${res.headers.get("retry-after") ?? "?"}`);
  }
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data).slice(0, 400)}`);
  return data;
}

function parseSseAssistant(sseText) {
  let assistant = "";
  for (const block of sseText.split("\n\n")) {
  const lines = block.split("\n");
    let event = "message";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (event === "token" && data) {
      try {
        const payload = JSON.parse(data);
        assistant += payload.t ?? payload.text ?? "";
      } catch {
        assistant += data;
      }
    }
    if (event === "error") throw new Error(`stream error: ${data}`);
  }
  return assistant;
}

const jar = new Map();
console.log("register", email);
await register();
await signIn(jar);

await jsonAuthed(jar, "/api/users/me");
await jsonAuthed(jar, "/api/credits/balance");
await jsonAuthed(jar, "/api/chat/models");
const conv = await jsonAuthed(jar, "/api/chat/conversations", {
  method: "POST",
  body: JSON.stringify({ title: "E2E", modelId }),
});
const convId = conv.data?.id ?? conv.id;
if (!convId) throw new Error("no conversation id: " + JSON.stringify(conv));

const streamRes = await fetch(`${base}/api/chat/conversations/${convId}/stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookieHeader(jar) },
  body: JSON.stringify({ content: "Reply with exactly: Hello from DARKBYTE", modelId }),
});
if (streamRes.status === 429) {
  throw new Error(`429 stream Retry-After=${streamRes.headers.get("retry-after")}`);
}
if (!streamRes.ok) {
  throw new Error(`stream ${streamRes.status}: ${(await streamRes.text()).slice(0, 400)}`);
}
const sse = await streamRes.text();
const assistant = parseSseAssistant(sse);
console.log("assistant:", assistant.slice(0, 300));
if (!assistant.trim()) {
  console.error("SSE snippet:", sse.slice(0, 500));
  process.exit(1);
}
console.log("PASS e2e-chat-http");