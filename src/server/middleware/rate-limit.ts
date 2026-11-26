const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 60_000);
const DEFAULT_MAX = Number(
  process.env.API_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 600 : 120),
);
const CHAT_STREAM_MAX = Number(process.env.API_RATE_LIMIT_CHAT_STREAM_MAX ?? 45);

/** Collapse dynamic IDs so each route family gets its own bucket. */
export function normalizeApiPath(pathname: string) {
  return pathname
    .replace(/\/[a-z0-9_-]{12,}(?=\/|$)/gi, "/:id")
    .replace(/\/[a-z0-9_-]{12,}$/i, "/:id");
}

export type RateLimitProfile = "api" | "chat-stream";

export function rateLimitKey(request: Request, profile: RateLimitProfile) {
  const ip = clientIp(request);
  if (profile === "chat-stream") return `${ip}:POST:chat-stream`;
  const path = normalizeApiPath(new URL(request.url).pathname);
  return `${ip}:${request.method}:${path}`;
}

function maxForProfile(profile: RateLimitProfile) {
  return profile === "chat-stream" ? CHAT_STREAM_MAX : DEFAULT_MAX;
}

export function checkRateLimit(
  request: Request,
  profile: RateLimitProfile = "api",
): { allowed: boolean; retryAfter?: number } {
  const key = rateLimitKey(request, profile);
  const max = maxForProfile(profile);
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

/** @deprecated Use checkRateLimit(request) — kept for tests that pass raw keys. */
export function checkRateLimitByKey(key: string, max = DEFAULT_MAX) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { allowed: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}