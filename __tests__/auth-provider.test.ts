import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAuthProviderMode, isClerkConfigured } from "@/server/auth/provider";

describe("auth provider mode", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  beforeEach(() => {
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    process.env.AUTH_PROVIDER = "authjs";
  });

  it("defaults to authjs when clerk keys are absent", () => {
    expect(getAuthProviderMode()).toBe("authjs");
    expect(isClerkConfigured()).toBe(false);
  });

  it("selects clerk only with keys and AUTH_PROVIDER=clerk", () => {
    process.env.AUTH_PROVIDER = "clerk";
    process.env.CLERK_SECRET_KEY = "sk_test_x";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_x";
    expect(getAuthProviderMode()).toBe("clerk");
    expect(isClerkConfigured()).toBe(true);
  });
});