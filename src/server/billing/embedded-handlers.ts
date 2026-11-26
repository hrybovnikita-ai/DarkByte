import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import { stripePublishableKey } from "@/lib/stripe-client";
import {
  BILLING_PERIODS,
  prismaBillingPeriod,
  subscriptionOffer,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { getAuthUser } from "@/server/auth/context";
import { apiError, apiSuccess } from "@/server/api/response";
import { checkoutOrigin, getStripe } from "@/server/credits/stripe";
import { readJsonBody } from "@/server/middleware/request";
import { checkRateLimitByKey } from "@/server/middleware/rate-limit";
import { ensureStripeCustomer } from "./customer";
import { clientSecretForSubscription } from "./embedded-stripe";
import { isStripePriceMapConfigured, priceIdFor } from "./prices";

const embeddedSchema = z
  .object({
    planId: z.enum(["starter", "pro", "ultimate"]),
    interval: z.enum(BILLING_PERIODS),
  })
  .strict();

function privateResponse<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function createEmbeddedStripeCheckout(request: Request) {
  const publishableKey = stripePublishableKey();
  if (!publishableKey || !isStripePriceMapConfigured()) {
    return apiError("Stripe embedded checkout is not configured", 503, "PAYMENTS_NOT_CONFIGURED");
  }

  const user = await getAuthUser(request, { required: true });
  const origin = checkoutOrigin();
  if (request.headers.get("origin") !== origin) return apiError("Invalid request origin", 403, "FORBIDDEN");

  const { planId, interval } = embeddedSchema.parse(await readJsonBody(request));
  const requestKey = z.uuid().parse(request.headers.get("idempotency-key"));
  const offer = subscriptionOffer(planId, interval);
  if (!offer) return apiError("Unknown plan", 400, "INVALID_PLAN");

  const rate = checkRateLimitByKey("billing-embedded:" + user.id, 30);
  if (!rate.allowed) return apiError("Too many checkout attempts", 429, "RATE_LIMIT");

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (error) {
    const message = error instanceof Error ? error.message : "PAYMENTS_NOT_CONFIGURED";
    return apiError("Payments are not configured", 503, message);
  }

  const stripePriceId = priceIdFor(planId as SubscriptionPlanId, interval);
  const billingPeriod = prismaBillingPeriod(interval);
  const db = requirePrisma();

  const checkout = await db.billingCheckout.upsert({
    where: { userId_requestKey: { userId: user.id, requestKey } },
    create: {
      userId: user.id,
      requestKey,
      planId,
      billingPeriod,
      amountCents: offer.amountCents,
      credits: offer.credits,
      stripePriceId,
    },
    update: {},
  });

  if (checkout.planId !== planId || checkout.billingPeriod !== billingPeriod) {
    return apiError("Use a new checkout key for a different plan", 409, "IDEMPOTENCY_CONFLICT");
  }

  const customerId = await ensureStripeCustomer(stripe, user);

  const incomplete = await stripe.subscriptions.list({
    customer: customerId,
    status: "incomplete",
    limit: 20,
  });
  const existing = incomplete.data.find((row) => row.metadata?.checkoutId === checkout.id);
  let subscription = existing;
  if (!subscription) {
    subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: {
          checkoutId: checkout.id,
          userId: user.id,
          planId,
          billingPeriod,
        },
        expand: ["latest_invoice"],
      },
      { idempotencyKey: `embedded:${checkout.id}` },
    );
  }

  if (subscription.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");

  const clientSecret = await clientSecretForSubscription(stripe, subscription);
  if (!clientSecret) {
    return apiError("Unable to start embedded payment", 503, "PAYMENTS_NOT_CONFIGURED");
  }

  return privateResponse({
    clientSecret,
    publishableKey,
    checkoutId: checkout.id,
    subscriptionId: subscription.id,
    returnUrl: `${origin}/checkout/success?kind=subscription&embedded=1`,
  });
}