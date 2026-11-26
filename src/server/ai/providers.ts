import type { AiModel } from "@/lib/ai-models";
import { providerEnvKey } from "@/lib/ai-models";

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_CONFIGURED" | "RATE_LIMIT" | "UNAVAILABLE" | "UPSTREAM",
    readonly status = 502,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

function apiKey(model: AiModel) {
  const value = process.env[providerEnvKey(model.provider)]?.trim();
  if (!value) throw new AiProviderError(`${model.label} is not configured on the server`, "NOT_CONFIGURED", 503);
  return value;
}

/** Maps upstream HTTP failures to stable client errors (never user credit 402). */
export function aiErrorFromHttpStatus(status: number, label: string, bodySnippet = ""): AiProviderError {
  if (status === 429) {
    return new AiProviderError("AI provider rate limit reached. Try again shortly.", "RATE_LIMIT", 429);
  }
  if (status === 401 || status === 403) {
    return new AiProviderError(`Invalid API credentials for ${label}.`, "NOT_CONFIGURED", 503);
  }
  if (status === 404) {
    return new AiProviderError("Selected model is unavailable.", "UNAVAILABLE", 503);
  }
  if (status === 402) {
    return new AiProviderError(
      `${label} billing is unavailable on the provider side. Your DARKBYTE credits were not charged — try another model.`,
      "UNAVAILABLE",
      503,
    );
  }
  if (status === 503 || status === 529) {
    return new AiProviderError(
      `${label} is temporarily overloaded. Your credits were not charged — try again or pick another model.`,
      "UNAVAILABLE",
      503,
    );
  }
  const detail = bodySnippet ? `: ${bodySnippet.slice(0, 200)}` : "";
  return new AiProviderError(`${label} failed (${status})${detail}`, "UPSTREAM", 502);
}

async function assertOk(response: Response, label: string) {
  if (response.ok) return;
  const body = await response.text().catch(() => "");
  throw aiErrorFromHttpStatus(response.status, label, body);
}

function parseOpenAiSse(buffer: string, onDelta: (text: string) => void) {
  const lines = buffer.split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (payload === "[DONE]") continue;
    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: string }; message?: { content?: string } }[];
      };
      const choice = json.choices?.[0];
      const text = choice?.delta?.content ?? choice?.message?.content;
      if (text) onDelta(text);
    } catch {
      /* partial SSE chunk */
    }
  }
}

export async function streamOpenAiCompatible(
  model: AiModel,
  messages: ChatTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
) {
  const key = apiKey(model);
  const url = model.provider === "groq"
    ? "https://api.groq.com/openai/v1/chat/completions"
    : model.provider === "sambanova"
      ? "https://api.sambanova.ai/v1/chat/completions"
      : model.provider === "nvidia"
        ? "https://integrate.api.nvidia.com/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (model.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.CREDITS_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
    headers["X-Title"] = "DARKBYTE";
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({
      model: model.id,
      stream: true,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  await assertOk(response, model.label);
  const reader = response.body?.getReader();
  if (!reader) throw new AiProviderError("Empty stream from provider", "UPSTREAM");
  const decoder = new TextDecoder();
  let carry = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const chunks = carry.split("\n\n");
    carry = chunks.pop() ?? "";
    for (const chunk of chunks) parseOpenAiSse(chunk + "\n", onDelta);
  }
  if (carry) parseOpenAiSse(carry, onDelta);
}

export async function streamGemini(
  model: AiModel,
  messages: ChatTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
) {
  const key = apiKey(model);
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const geminiHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-goog-api-key": key,
  };
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: geminiHeaders,
      signal,
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
      }),
    },
  );
  await assertOk(response, model.label);
  const reader = response.body?.getReader();
  if (!reader) throw new AiProviderError("Empty stream from Gemini", "UPSTREAM");
  const decoder = new TextDecoder();
  let carry = "";
  let geminiAggregate = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const lines = carry.split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6)) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (text.length > geminiAggregate.length) {
          onDelta(text.slice(geminiAggregate.length));
          geminiAggregate = text;
        }
      } catch {
        /* ignore partial json */
      }
    }
  }
}

export async function streamCohere(
  model: AiModel,
  messages: ChatTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
) {
  const key = apiKey(model);
  const response = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model: model.id,
      stream: true,
      messages: messages.filter((m) => m.role !== "system").map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: [{ type: "text", text: m.content }],
      })),
    }),
  });
  await assertOk(response, model.label);
  const reader = response.body?.getReader();
  if (!reader) throw new AiProviderError("Empty stream from Cohere", "UPSTREAM");
  const decoder = new TextDecoder();
  let carry = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split("\n");
    carry = parts.pop() ?? "";
    for (const line of parts) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6)) as { type?: string; delta?: { message?: { content?: { text?: string }[] } } };
        if (json.type === "content-delta") {
          const text = json.delta?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
          if (text) onDelta(text);
        }
      } catch { /* ignore */ }
    }
  }
}

export async function streamCloudflare(
  model: AiModel,
  messages: ChatTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
) {
  const key = apiKey(model);
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!account) throw new AiProviderError("Cloudflare account is not configured", "NOT_CONFIGURED", 503);
  const prompt = messages.filter((m) => m.role !== "system").map((m) => `${m.role}: ${m.content}`).join("\n");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${encodeURIComponent(model.id)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], stream: true }),
    },
  );
  await assertOk(response, model.label);
  const reader = response.body?.getReader();
  if (!reader) throw new AiProviderError("Empty stream from Cloudflare", "UPSTREAM");
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onDelta(text);
  }
}

export async function streamModel(
  model: AiModel,
  messages: ChatTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
) {
  if (model.provider === "gemini") return streamGemini(model, messages, onDelta, signal);
  if (model.provider === "cohere") return streamCohere(model, messages, onDelta, signal);
  if (model.provider === "cloudflare") return streamCloudflare(model, messages, onDelta, signal);
  return streamOpenAiCompatible(model, messages, onDelta, signal);
}

export function listConfiguredModels(models: AiModel[]) {
  return models.filter((model) => Boolean(process.env[providerEnvKey(model.provider)]?.trim()));
}