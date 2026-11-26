import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import {
  BILLING_PERIODS,
  findSubscriptionPlan,
  prismaBillingPeriod,
  publicBillingPeriod,
  subscriptionOffer,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { getAuthUser } from "@/server/auth/context";
import { apiError, apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { checkRateLimitByKey } from "@/server/middleware/rate-limit";
import { checkoutOrigin, getStripe } from "@/server/credits/stripe";
import { ensureStripeCustomer } from "./customer";
import { isStripePriceMapConfigured, priceIdFor } from "./prices";

const checkoutSchema = z
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

export async function createSubscriptionCheckout(request: Request) {
  if (!isStripePriceMapConfigured()) {
    return apiError("Payments are not configured", 503, "PAYMENTS_NOT_CONFIGURED");
  }

  const user = await getAuthUser(request, { required: true });
  const origin = checkoutOrigin();
  if (request.headers.get("origin") !== origin) return apiError("Invalid request origin", 403, "FORBIDDEN");

  const { planId, interval } = checkoutSchema.parse(await readJsonBody(request));
  const requestKey = z.uuid().parse(request.headers.get("idempotency-key"));
  const offer = subscriptionOffer(planId, interval);
  if (!offer) return apiError("Unknown plan", 400, "INVALID_PLAN");

  const rate = checkRateLimitByKey("billing-checkout:" + user.id, 30);
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

  if (!checkout.stripeSessionId && Date.now() - checkout.createdAt.getTime() > 23 * 60 * 60 * 1000) {
    return apiError("Checkout expired. Please try again.", 409, "CHECKOUT_EXPIRED");
  }

  const customerId = await ensureStripeCustomer(stripe, user);

  const session = checkout.stripeSessionId
    ? await stripe.checkout.sessions.retrieve(checkout.stripeSessionId)
  : await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        billing_address_collection: "auto",
        customer_email: checkout.stripeSessionId ? undefined : user.email,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        allow_promotion_codes: false,
        subscription_data: {
          metadata: {
            checkoutId: checkout.id,
            userId: user.id,
            planId,
            billingPeriod,
          },
        },
        metadata: {
          checkoutId: checkout.id,
          userId: user.id,
          planId,
          billingPeriod,
        },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&kind=subscription`,
        cancel_url: `${origin}/checkout/cancelled?kind=subscription`,
      },
      { idempotencyKey: `billing:${checkout.id}` },
    );

  if (session.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");

  await db.billingCheckout.update({
    where: { id: checkout.id },
    data: { stripeSessionId: session.id },
  });

  if (!session.url || session.status !== "open") {
    return apiError("Checkout expired or completed. Please try again.", 409, "CHECKOUT_EXPIRED");
  }

  return privateResponse({ url: session.url });
}

export async function getBillingStatus(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const db = requirePrisma();

  const subscription = await db.billingSubscription.findFirst({
    where: { userId: user.id, status: { in: ["ACTIVE", "PAST_DUE", "INCOMPLETE"] } },
    orderBy: { updatedAt: "desc" },
  });

  const payments = await db.billingPayment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      planId: true,
      billingPeriod: true,
      amountCents: true,
      credits: true,
      status: true,
      stripeInvoiceId: true,
      stripeSessionId: true,
      cardBrand: true,
      cardLast4: true,
      createdAt: true,
      creditsGrantedAt: true,
    },
  });

  const plan = subscription ? findSubscriptionPlan(subscription.planId) : null;

  return privateResponse({
    paymentsConfigured: isStripePriceMapConfigured(),
    subscription: subscription
      ? {
          planId: subscription.planId,
          planName: plan?.name ?? subscription.planId,
          billingPeriod: publicBillingPeriod(subscription.billingPeriod),
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    payments: payments.map((payment) => ({
      id: payment.id,
      planId: payment.planId,
      planName: findSubscriptionPlan(payment.planId)?.name ?? payment.planId,
      billingPeriod: publicBillingPeriod(payment.billingPeriod),
      amountCents: payment.amountCents,
      credits: payment.credits,
      status: payment.status,
      transactionId: payment.stripeInvoiceId,
      sessionId: payment.stripeSessionId,
      cardBrand: payment.cardBrand,
      cardLast4: payment.cardLast4,
      createdAt: payment.createdAt.toISOString(),
      creditsGranted: payment.creditsGrantedAt !== null,
    })),
  });
}