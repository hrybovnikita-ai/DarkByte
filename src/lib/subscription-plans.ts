/** Server-owned subscription catalog. Clients cannot choose a price. */
export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    color: "#ff4545",
    periods: {
      month: { amountCents: 500, credits: 500, label: "Monthly" },
      year: { amountCents: 5000, credits: 6000, label: "Yearly" },
    },
    features: ["Credits every billing period", "Cancel anytime", "Sandbox checkout — no real charges"],
  },
  {
    id: "pro",
    name: "Pro",
    color: "#a855f7",
    periods: {
      month: { amountCents: 1500, credits: 2000, label: "Monthly" },
      year: { amountCents: 15000, credits: 24000, label: "Yearly" },
    },
    features: ["Larger credit grant each period", "Monthly or yearly billing", "Sandbox checkout — no real charges"],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    color: "#f0c400",
    periods: {
      month: { amountCents: 2500, credits: 5000, label: "Monthly" },
      year: { amountCents: 25000, credits: 60000, label: "Yearly" },
    },
    features: ["Highest credit grant each period", "Monthly or yearly billing", "Sandbox checkout — no real charges"],
  },
] as const;

export const BILLING_PERIODS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_PERIODS)[number];
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number]["id"];

export function findSubscriptionPlan(id: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

export function subscriptionOffer(planId: string, interval: string) {
  const plan = findSubscriptionPlan(planId);
  if (!plan || (interval !== "month" && interval !== "year")) return null;
  const period = plan.periods[interval];
  return { plan, interval, ...period };
}

export function prismaBillingPeriod(interval: BillingInterval): "MONTH" | "YEAR" {
  return interval === "month" ? "MONTH" : "YEAR";
}

export function publicBillingPeriod(period: "MONTH" | "YEAR"): BillingInterval {
  return period === "MONTH" ? "month" : "year";
}
