export type AiProvider = "gemini" | "groq" | "openrouter" | "sambanova" | "cohere" | "nvidia" | "cloudflare";

export type AiModel = {
  id: string;
  label: string;
  provider: AiProvider;
  /** Credits charged per successful assistant reply (server-enforced). */
  creditCost: number;
};

export const AI_MODELS: AiModel[] = [
  { id: "gemini-3.8-flash", label: "Google · Gemini 3.8 Flash", provider: "gemini", creditCost: 3 },
  { id: "openai/gpt-oss-20b", label: "Groq · GPT-OSS 20B", provider: "groq", creditCost: 1 },
  { id: "qwen/qwen3.8-27b", label: "Groq · Qwen3 27B", provider: "groq", creditCost: 2 },
  { id: "gemma-4-31B-it", label: "SambaNova · Gemma 4 31B", provider: "sambanova", creditCost: 2 },
  { id: "meta-llama/llama-3.1-8b-instruct", label: "OpenRouter · Llama 3.1 8B", provider: "openrouter", creditCost: 1 },
  { id: "command-r7b-12-2024", label: "Cohere · Command R7B", provider: "cohere", creditCost: 2 },
  { id: "meta/llama-3.1-8b-instruct", label: "NVIDIA NIM · Llama 3.1 8B", provider: "nvidia", creditCost: 2 },
  { id: "@cf/meta/llama-3.1-8b-instruct", label: "Cloudflare · Llama 3.1 8B", provider: "cloudflare", creditCost: 2 },
];

export function findAiModel(id: string) {
  return AI_MODELS.find((model) => model.id === id);
}

export function providerEnvKey(provider: AiProvider) {
  const map: Record<AiProvider, string> = {
    gemini: "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    sambanova: "SAMBANOVA_API_KEY",
    cohere: "COHERE_API_KEY",
    nvidia: "NVIDIA_NIM_API_KEY",
    cloudflare: "CLOUDFLARE_API_TOKEN",
  };
  return map[provider];
}