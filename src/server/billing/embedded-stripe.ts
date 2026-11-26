import type Stripe from "stripe";
import { getStripe } from "@/server/credits/stripe";
import { invoicePaymentIntentId } from "./stripe-fields";

export async function paymentIntentClientSecret(
  stripe: ReturnType<typeof getStripe>,
  invoice: Stripe.Invoice | string,
): Promise<string | null> {
  const row = typeof invoice === "string" ? await stripe.invoices.retrieve(invoice, { expand: ["payments.data.payment.payment_intent"] }) : invoice;
  const fromPayments = invoicePaymentIntentId(row);
  if (fromPayments) {
    const intent = await stripe.paymentIntents.retrieve(fromPayments);
    return intent.client_secret;
  }
  return null;
}

export async function clientSecretForSubscription(
  stripe: ReturnType<typeof getStripe>,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const latest = subscription.latest_invoice;
  if (!latest) return null;
  if (typeof latest === "string") return paymentIntentClientSecret(stripe, latest);
  return paymentIntentClientSecret(stripe, latest.id);
}