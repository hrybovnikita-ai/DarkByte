import type Stripe from "stripe";
import { apiError, apiSuccess, handleRouteError } from "@/server/api/response";
import { getStripe } from "@/server/credits/stripe";
import { fulfillCreditPurchase, PaymentMismatchError } from "@/server/credits/ledger";



// No cookie authentication or shared IP rate limit: Stripe authenticates with its signature.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_")) return apiError("Payments are not configured", 503, "PAYMENTS_NOT_CONFIGURED");
  let stripe: ReturnType<typeof getStripe>;
  try { stripe = getStripe(); } catch (error) { return handleRouteError(error); }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return apiError("Missing signature", 400, "INVALID_SIGNATURE");
  let event: Stripe.Event;
  try {
    // Preserve the raw body. Stripe also enforces its default timestamp tolerance.
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return apiError("Invalid webhook signature", 400, "INVALID_SIGNATURE");
  }
  if (event.livemode) return apiError("Live payments are disabled", 400, "LIVE_MODE_DISABLED");
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return apiSuccess({ received: true });
  }
  try {
    const result = await fulfillCreditPurchase(event.data.object as Stripe.Checkout.Session, event.id);
    return apiSuccess({ received: true, result });
  } catch (error) {
    if (error instanceof PaymentMismatchError) return apiError("Payment does not match purchase", 400, "PAYMENT_MISMATCH");
    // Return a failure on database errors so Stripe retries; never acknowledge an uncommitted credit.
    return handleRouteError(error);
  }
}
