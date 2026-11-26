import { afterEach, describe, expect, it, vi } from "vitest";
import { checkoutOrigin, getStripe } from "@/server/credits/stripe";
import { spendCredits } from "@/server/credits/ledger";
import { userPatchSchema } from "@/server/validators/resources";
import type { PrismaClient } from "@prisma/client";

afterEach(() => vi.unstubAllEnvs());
describe("credit configuration and mutation boundaries", () => {
  it("refuses missing or live Stripe keys", () => {
    for (const key of ["", "sk_live_fake"]) {
      vi.stubEnv("STRIPE_SECRET_KEY", key);
      expect(getStripe).toThrow("PAYMENTS_NOT_CONFIGURED");
    }
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_local");
    expect(getStripe()).toBeDefined();
  });
  it("only allows HTTPS or loopback HTTP origins", () => {
    vi.stubEnv("CREDITS_APP_URL", "http://evil.example");
    expect(checkoutOrigin).toThrow();
    vi.stubEnv("CREDITS_APP_URL", "http://localhost:3000/");
    expect(checkoutOrigin()).toBe("http://localhost:3000");
  });
  it("profile updates cannot mass-assign balance, ledger or role", () => {
    expect(userPatchSchema.parse({ name: "User", balance: 999, creditAccount: { balance: 999 }, creditTransactions: { create: {} }, role: "ADMIN" })).toEqual({ name: "User" });
  });
  it.each([0, -1, 1.5, NaN, Infinity, 2_147_483_648])("rejects unsafe debit %s before any database call", async (amount) => {
    await expect(spendCredits("u", amount, "op", "test", {} as PrismaClient)).rejects.toThrow("INVALID_CREDIT_DEBIT");
  });
});
