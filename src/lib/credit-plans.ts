/** Public catalog; the server uses this same allowlist, never client prices. */
export const CREDIT_PLANS = [
  { id: "starter", name: "Starter", amountCents: 500, credits: 500, color: "#ff4545", features: ["500 credits in your account", "One-time payment", "No subscription"] },
  { id: "pro", name: "Pro", amountCents: 1500, credits: 2000, color: "#a855f7", features: ["2,000 credits in your account", "One-time payment", "No subscription"] },
  { id: "ultimate", name: "Ultimate", amountCents: 2500, credits: 5000, color: "#f0c400", features: ["5,000 credits in your account", "One-time payment", "No subscription"] },
] as const;

export type CreditPlanId = (typeof CREDIT_PLANS)[number]["id"];
export function findCreditPlan(id: string) {
  return CREDIT_PLANS.find((plan) => plan.id === id);
}
