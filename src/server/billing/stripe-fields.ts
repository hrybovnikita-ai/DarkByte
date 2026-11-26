import type Stripe from "stripe";

export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ends = sub.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  if (!ends.length) return null;
  return new Date(Math.max(...ends) * 1000);
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent?.subscription_details?.subscription;
  if (!parent) return null;
  return typeof parent === "string" ? parent : parent.id;
}

export function invoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  for (const payment of invoice.payments?.data ?? []) {
    const intent = payment.payment?.payment_intent;
    if (!intent) continue;
    return typeof intent === "string" ? intent : intent.id;
  }
  return null;
}