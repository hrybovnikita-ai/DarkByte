import { afterEach, describe, expect, it, vi } from "vitest";
import { secureAuthCookiesEnabled } from "@/server/auth/cookies";

describe("secureAuthCookiesEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables secure cookie names on Vercel HTTPS", () => {
    vi.stubEnv("AUTH_URL", "https://darkbyte-olive.vercel.app");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    expect(secureAuthCookiesEnabled()).toBe(true);
  });

  it("uses non-secure names on local HTTP", () => {
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    expect(secureAuthCookiesEnabled()).toBe(false);
  });
});