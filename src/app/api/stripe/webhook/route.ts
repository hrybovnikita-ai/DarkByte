import type Stripe from "stripe";
import { apiError, apiSuccess, handleRouteError } from "@/server/api/response";
import {
  fulfillSubscriptionInvoice,
  markSubscriptionCanceled,
  recordSubscriptionInvoiceFailure,
  syncStripeSubscription,
  syncSubscriptionCheckoutSession,
} from "@/server/billing/fulfill";
import { getStripe } from "@/server/credits/stripe";
import { fulfillCreditPurchase, PaymentMismatchError } from "@/server/credits/ledger";

// No cookie authentication or shared IP rate limit: Stripe authenticates with its signature.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_")) return apiError("Payments are not configured", 503, "PAYMENTS_NOT_CONFIGURED");
  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (error) {
    return handleRouteError(error);
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return apiError("Missing signature", 400, "INVALID_SIGNATURE");
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return apiError("Invalid webhook signature", 400, "INVALID_SIGNATURE");
  }
  if (event.livemode) return apiError("Live payments are disabled", 400, "LIVE_MODE_DISABLED");

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "payment") {
          const result = await fulfillCreditPurchase(session, event.id);
          return apiSuccess({ received: true, result });
        }
        if (session.mode === "subscription") {
          const result = await syncSubscriptionCheckoutSession(session, event.id);
          return apiSuccess({ received: true, result });
        }
        return apiSuccess({ received: true, result: "ignored" });
      }
      case "invoice.paid": {
        const result = await fulfillSubscriptionInvoice(event.data.object as Stripe.Invoice, event.id);
        return apiSuccess({ received: true, result });
      }
      case "invoice.payment_failed": {
        const result = await recordSubscriptionInvoiceFailure(event.data.object as Stripe.Invoice, event.id);
        return apiSuccess({ received: true, result });
      }
      case "customer.subscription.updated": {
        const result = await syncStripeSubscription(event.data.object as Stripe.Subscription);
        return apiSuccess({ received: true, result });
      }
      case "customer.subscription.deleted": {
        const result = await markSubscriptionCanceled(event.data.object as Stripe.Subscription);
        return apiSuccess({ received: true, result });
      }
      default:
        return apiSuccess({ received: true });
    }
  } catch (error) {
    if (error instanceof PaymentMismatchError) {
      return apiError("Payment does not match purchase", 400, "PAYMENT_MISMATCH");
    }
    return handleRouteError(error);
  }
}