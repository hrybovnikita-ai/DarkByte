import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isUpstashRedisConfigured } from "@/server/auth/provider";

const WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 60_000);
const DEFAULT_MAX = Number(
  process.env.API_RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "development" ? 600 : 120),
);
const CHAT_STREAM_MAX = Number(process.env.API_RATE_LIMIT_CHAT_STREAM_MAX ?? 45);

type Profile = "api" | "chat-stream";

let ratelimiters: Record<Profile, Ratelimit> | null = null;

function limiters(): Record<Profile, Ratelimit> | null {
  if (!isUpstashRedisConfigured()) return null;
  if (ratelimiters) return ratelimiters;
  const redis = Redis.fromEnv();
  const windowSec = Math.max(1, Math.ceil(WINDOW_MS / 1000));
  ratelimiters = {
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DEFAULT_MAX, `${windowSec} s`),
      prefix: "darkbyte:api",
    }),
    "chat-stream": new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(CHAT_STREAM_MAX, `${windowSec} s`),
      prefix: "darkbyte:chat-stream",
    }),
  };
  return ratelimiters;
}

export async function checkRateLimitRedis(
  identifier: string,
  profile: Profile,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limiter = limiters()?.[profile];
  if (!limiter) return { allowed: true };
  const result = await limiter.limit(identifier);
  if (result.success) return { allowed: true };
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { allowed: false, retryAfter };
}