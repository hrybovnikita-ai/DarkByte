import { describe, expect, it, vi } from "vitest";
import { isStripePriceMapConfigured, priceIdFor, readStripePriceIds } from "@/server/billing/prices";

const SAMPLE = JSON.stringify({
  starter_month: "price_starterm01",
  starter_year: "price_startery01",
  pro_month: "price_promonth01",
  pro_year: "price_proyear01",
  ultimate_month: "price_ultimatem01",
  ultimate_year: "price_ultimatey01",
});

describe("STRIPE_PRICE_IDS", () => {
  it("rejects missing or duplicate entries", () => {
    vi.stubEnv("STRIPE_PRICE_IDS", '{"starter_month":"price_a"}');
    expect(() => readStripePriceIds()).toThrow("PAYMENTS_NOT_CONFIGURED");
    vi.unstubAllEnvs();
  });

  it("resolves a catalog price", () => {
    vi.stubEnv("STRIPE_PRICE_IDS", SAMPLE);
    expect(priceIdFor("pro", "month")).toBe("price_promonth01");
    expect(isStripePriceMapConfigured()).toBe(true);
    vi.unstubAllEnvs();
  });
});