import { subscriptionOffer, type BillingInterval, type SubscriptionPlanId } from "@/lib/subscription-plans";

const PRICE_KEYS = [
  "starter_month",
  "starter_year",
  "pro_month",
  "pro_year",
  "ultimate_month",
  "ultimate_year",
] as const;

export type StripePriceKey = (typeof PRICE_KEYS)[number];

export function priceKey(planId: SubscriptionPlanId, interval: BillingInterval): StripePriceKey {
  return `${planId}_${interval}`;
}

/** Test-mode Price IDs only. Missing or malformed configuration refuses checkout. */
export function readStripePriceIds(raw = process.env.STRIPE_PRICE_IDS): Record<StripePriceKey, string> {
  if (!raw?.trim()) throw new Error("PAYMENTS_NOT_CONFIGURED");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("PAYMENTS_NOT_CONFIGURED");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("PAYMENTS_NOT_CONFIGURED");
  const source = parsed as Record<string, unknown>;
  const ids = {} as Record<StripePriceKey, string>;
  const seen = new Set<string>();
  for (const key of PRICE_KEYS) {
    const value = source[key];
    if (typeof value !== "string" || !/^price_[A-Za-z0-9]+$/.test(value) || seen.has(value)) {
      throw new Error("PAYMENTS_NOT_CONFIGURED");
    }
    seen.add(value);
    ids[key] = value;
  }
  return ids;
}

export function priceIdFor(planId: SubscriptionPlanId, interval: BillingInterval) {
  const offer = subscriptionOffer(planId, interval);
  if (!offer) throw new Error("PAYMENTS_NOT_CONFIGURED");
  return readStripePriceIds()[priceKey(planId, interval)];
}

export function isStripePriceMapConfigured() {
  try {
    readStripePriceIds();
    return true;
  } catch {
    return false;
  }
}
