import { AI_MODELS, type AiModel, providerEnvKey } from "@/lib/ai-models";

type Cache = { at: number; models: AiModel[] };
let cache: Cache | null = null;
const TTL_MS = 10 * 60 * 1000;

async function fetchJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

async function openAiModelIds(url: string, headers: Record<string, string>) {
  const body = await fetchJson(url, headers);
  if (!body || typeof body !== "object" || !("data" in body)) return null;
  const data = (body as { data?: { id?: string }[] }).data ?? [];
  return new Set(data.map((row) => row.id).filter(Boolean) as string[]);
}

async function providerModelIds(provider: AiModel["provider"]): Promise<Set<string> | null> {
  const key = process.env[providerEnvKey(provider)]?.trim();
  if (!key) return null;
  if (provider === "groq") {
    return openAiModelIds("https://api.groq.com/openai/v1/models", { Authorization: `Bearer ${key}` });
  }
  if (provider === "openrouter") {
    const auth = await fetchJson("https://openrouter.ai/api/v1/auth/key", { Authorization: `Bearer ${key}` });
    const meta = auth && typeof auth === "object" && "data" in auth
      ? (auth as {
          data?: {
            limit?: number | null;
            usage?: number;
            limit_remaining?: number | null;
            is_free_tier?: boolean;
          };
        }).data
      : undefined;
    if (meta?.limit === 0) return new Set();
    if (meta?.limit_remaining === 0) return new Set();
    if (
      meta?.is_free_tier &&
      (meta.limit === 0 || meta.limit === null) &&
      (meta.usage ?? 0) === 0
    ) {
      return new Set();
    }
    const body = await fetchJson("https://openrouter.ai/api/v1/models", { Authorization: `Bearer ${key}` });
    if (!body || typeof body !== "object" || !("data" in body)) return null;
    const data = (body as { data?: { id?: string }[] }).data ?? [];
    return new Set(data.map((row) => row.id).filter(Boolean) as string[]);
  }
  if (provider === "sambanova") {
    return openAiModelIds("https://api.sambanova.ai/v1/models", { Authorization: `Bearer ${key}` });
  }
  if (provider === "nvidia") {
    return openAiModelIds("https://integrate.api.nvidia.com/v1/models", { Authorization: `Bearer ${key}` });
  }
  if (provider === "cohere") {
    const body = await fetchJson("https://api.cohere.com/v1/models", { Authorization: `Bearer ${key}` });
    if (!body || typeof body !== "object" || !("models" in body)) return null;
    const models = (body as { models?: { name?: string }[] }).models ?? [];
    return new Set(models.map((m) => m.name).filter(Boolean) as string[]);
  }
  if (provider === "cloudflare") {
    const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    if (!account) return null;
    const body = await fetchJson(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/models/search`,
      { Authorization: `Bearer ${key}` },
    );
    if (!body || typeof body !== "object" || !("result" in body)) return null;
    const result = (body as { result?: { id?: string; name?: string }[] }).result ?? [];
    return new Set(result.flatMap((m) => [m.id, m.name].filter(Boolean) as string[]));
  }
  if (provider === "gemini") {
    const body = await fetchJson("https://generativelanguage.googleapis.com/v1beta/models", { "x-goog-api-key": key });
    if (!body || typeof body !== "object" || !("models" in body)) return new Set();
    const names = (body as { models?: { name?: string }[] }).models ?? [];
    return new Set(names.map((m) => (m.name ?? "").replace(/^models\//, "")).filter(Boolean));
  }
  return null;
}

export async function resolveAvailableModels(force = false): Promise<AiModel[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.models;
  const byProvider = new Map<AiModel["provider"], Set<string> | null>();
  for (const provider of new Set(AI_MODELS.map((m) => m.provider))) {
    byProvider.set(provider, await providerModelIds(provider));
  }
  const models = AI_MODELS.filter((model) => {
    const key = process.env[providerEnvKey(model.provider)]?.trim();
    if (!key) return false;
    if (model.provider === "cloudflare" && !process.env.CLOUDFLARE_ACCOUNT_ID?.trim()) return false;
    const remote = byProvider.get(model.provider);
    if (!remote) return false;
    return remote.has(model.id);
  });
  cache = { at: Date.now(), models };
  return models;
}

export function findResolvedModel(id: string, models: AiModel[]) {
  return models.find((model) => model.id === id);
}