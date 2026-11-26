export type AuthProviderMode = "clerk" | "authjs";

export function getAuthProviderMode(): AuthProviderMode {
  if (process.env.AUTH_PROVIDER === "clerk" && isClerkConfigured()) {
    return "clerk";
  }
  return "authjs";
}

export function isClerkAuthEnabled(): boolean {
  return getAuthProviderMode() === "clerk";
}

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
  );
}

export function isUpstashRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}