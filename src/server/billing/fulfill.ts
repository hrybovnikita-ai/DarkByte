import { Prisma, type PrismaClient, type SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";
import { requirePrisma } from "@/lib/db";
import { findSubscriptionPlan, type BillingInterval } from "@/lib/subscription-plans";
import { PaymentMismatchError } from "@/server/credits/ledger";
import { getStripe } from "@/server/credits/stripe";
import { sanitizeCard, sanitizeFailureCode } from "./card";
import { sendSubscriptionReceipt } from "./email";
import {
  invoicePaymentIntentId,
  invoiceSubscriptionId,
  subscriptionPeriodEnd,
} from "./stripe-fields";

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function mapSubscriptionStatus(value: Stripe.Subscription.Status): SubscriptionStatus {
  if (value === "active" || value === "trialing") return "ACTIVE";
  if (value === "past_due") return "PAST_DUE";
  if (value === "canceled") return "CANCELED";
  if (value === "unpaid") return "UNPAID";
  return "INCOMPLETE";
}

function periodLabel(period: "MONTH" | "YEAR") {
  return period === "MONTH" ? "Monthly" : "Yearly";
}

async function paymentMethodFrom(
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<{ brand: string | null; last4: string | null }> {
  if (!paymentIntentId) return { brand: null, last4: null };
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["payment_method"] });
    const pm = intent.payment_method;
    if (!pm || typeof pm === "string") return { brand: null, last4: null };
    const card = pm.card;
    if (!card) return { brand: null, last4: null };
    return sanitizeCard(card.brand, card.last4) ?? { brand: null, last4: null };
  } catch {
    return { brand: null, last4: null };
  }
}

/** Links a completed subscription checkout session to the stored checkout row. */
export async function syncSubscriptionCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
  db: PrismaClient = requirePrisma(),
) {
  if (session.livemode || session.mode !== "subscription") return "ignored";

  const checkoutId = session.metadata?.checkoutId;
  if (!checkoutId) return "ignored";

  const checkout = await db.billingCheckout.findUnique({ where: { id: checkoutId } });
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (
    !checkout ||
    !subscriptionId ||
    checkout.userId !== session.client_reference_id ||
    session.metadata?.userId !== checkout.userId ||
    session.metadata?.planId !== checkout.planId ||
    session.metadata?.billingPeriod !== checkout.billingPeriod ||
    (checkout.stripeSessionId !== null && checkout.stripeSessionId !== session.id)
  ) {
    throw new PaymentMismatchError("Subscription checkout does not match stored order");
  }

  await db.billingCheckout.update({
    where: { id: checkout.id },
    data: { stripeSessionId: session.id },
  });

  const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId);
  if (stripeSub.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");

  await db.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      userId: checkout.userId,
      planId: checkout.planId,
      billingPeriod: checkout.billingPeriod,
      status: mapSubscriptionStatus(stripeSub.status),
      stripeCustomerId:
        typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: checkout.stripePriceId,
      currentPeriodEnd: subscriptionPeriodEnd(stripeSub),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      status: mapSubscriptionStatus(stripeSub.status),
      currentPeriodEnd: subscriptionPeriodEnd(stripeSub),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });

  void eventId;
  return "synced";
}

/** Credits and receipt are granted only after a verified invoice.paid webhook. */
export async function fulfillSubscriptionInvoice(
  invoice: Stripe.Invoice,
  eventId: string,
  db: PrismaClient = requirePrisma(),
) {
  if (invoice.livemode || invoice.status !== "paid") return "ignored";

  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return "ignored";

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
  if (stripeSub.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");

  const snapshot = invoice.parent?.subscription_details?.metadata ?? {};
  const checkoutId = stripeSub.metadata?.checkoutId ?? snapshot.checkoutId;
  const userId = stripeSub.metadata?.userId ?? snapshot.userId;
  const planId = stripeSub.metadata?.planId ?? snapshot.planId;
  const billingPeriodRaw = stripeSub.metadata?.billingPeriod ?? snapshot.billingPeriod;

  const checkout = checkoutId ? await db.billingCheckout.findUnique({ where: { id: checkoutId } }) : null;

  const resolvedPlanId = planId ?? checkout?.planId;
  const resolvedUserId = userId ?? checkout?.userId;
  const resolvedPeriod =
    billingPeriodRaw === "MONTH" || billingPeriodRaw === "YEAR"
      ? billingPeriodRaw
      : checkout?.billingPeriod;

  if (!resolvedPlanId || !resolvedUserId || !resolvedPeriod || !checkout) {
    throw new PaymentMismatchError("Subscription invoice missing billing metadata");
  }

  const offer = findSubscriptionPlan(resolvedPlanId);
  if (!offer) throw new PaymentMismatchError("Unknown subscription plan");

  const interval = (resolvedPeriod === "MONTH" ? "month" : "year") as BillingInterval;
  const period = offer.periods[interval];
  if (invoice.amount_paid !== period.amountCents || invoice.currency !== "usd") {
    throw new PaymentMismatchError("Invoice amount does not match catalog");
  }

  const paymentIntentId = invoicePaymentIntentId(invoice);
  const sessionId = checkout.stripeSessionId;

  if (
    checkout.userId !== resolvedUserId ||
    checkout.planId !== resolvedPlanId ||
    checkout.billingPeriod !== resolvedPeriod ||
    checkout.credits !== period.credits
  ) {
    throw new PaymentMismatchError("Checkout row does not match subscription");
  }

  const card = await paymentMethodFrom(stripe, paymentIntentId);

  const subscription = await db.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      userId: resolvedUserId,
      planId: resolvedPlanId,
      billingPeriod: resolvedPeriod,
      status: mapSubscriptionStatus(stripeSub.status),
      stripeCustomerId:
        typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: checkout.stripePriceId,
      currentPeriodEnd: subscriptionPeriodEnd(stripeSub),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      status: mapSubscriptionStatus(stripeSub.status),
      currentPeriodEnd: subscriptionPeriodEnd(stripeSub),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });

  try {
    const payment = await db.$transaction(async (tx) => {
      const row = await tx.billingPayment.create({
        data: {
          userId: resolvedUserId,
          checkoutId: checkout.id,
          subscriptionId: subscription.id,
          planId: resolvedPlanId,
          billingPeriod: resolvedPeriod,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          credits: period.credits,
          status: "SUCCEEDED",
          stripeInvoiceId: invoice.id,
          stripeSessionId: sessionId,
          stripePaymentIntentId: paymentIntentId,
          stripeEventId: eventId,
          cardBrand: card.brand,
          cardLast4: card.last4,
          creditsGrantedAt: new Date(),
        },
      });
      await tx.creditTransaction.create({
        data: {
          userId: resolvedUserId,
          amount: period.credits,
          kind: "SUBSCRIPTION",
          description: `${resolvedPlanId} subscription — ${periodLabel(resolvedPeriod)}`,
          idempotencyKey: `subscription:${invoice.id}`,
          stripeInvoiceId: invoice.id,
          stripeEventId: eventId,
        },
      });
      await tx.creditAccount.upsert({
        where: { userId: resolvedUserId },
        create: { userId: resolvedUserId, balance: period.credits },
        update: { balance: { increment: period.credits } },
      });
      return row;
    });

    if (!payment.receiptSentAt) {
      const user = await db.user.findUnique({ where: { id: resolvedUserId }, select: { email: true } });
      if (user?.email) {
        const sent = await sendSubscriptionReceipt({
          to: user.email,
          planName: offer.name,
          amountCents: invoice.amount_paid,
          transactionId: invoice.id,
          status: "Successful",
          paidAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000),
          cardBrand: card.brand,
          cardLast4: card.last4,
          billingPeriodLabel: periodLabel(resolvedPeriod),
        });
        if (sent.sent) {
          await db.billingPayment.update({
            where: { id: payment.id },
            data: { receiptSentAt: new Date() },
          });
        }
      }
    }
    return "credited";
  } catch (error) {
    if (isUniqueConflict(error)) {
      const existing = await db.billingPayment.findUnique({ where: { stripeInvoiceId: invoice.id } });
      if (existing?.stripeEventId === eventId) return "already_credited";
    }
    throw error;
  }
}

export async function recordSubscriptionInvoiceFailure(
  invoice: Stripe.Invoice,
  eventId: string,
  db: PrismaClient = requirePrisma(),
) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (invoice.livemode || !subscriptionId) return "ignored";
  const checkoutId = (await getStripe().subscriptions.retrieve(subscriptionId)).metadata?.checkoutId;
  const checkout = checkoutId ? await db.billingCheckout.findUnique({ where: { id: checkoutId } }) : null;
  if (!checkout) return "ignored";

  const failureCode = sanitizeFailureCode(invoice.last_finalization_error?.code ?? "payment_failed");

  try {
    await db.billingPayment.create({
      data: {
        userId: checkout.userId,
        checkoutId: checkout.id,
        planId: checkout.planId,
        billingPeriod: checkout.billingPeriod,
        amountCents: invoice.amount_due ?? checkout.amountCents,
        credits: 0,
        status: "FAILED",
        stripeInvoiceId: invoice.id,
        stripeEventId: eventId,
        failureCode,
      },
    });
    await db.billingSubscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: "PAST_DUE" },
    });
    return "recorded";
  } catch (error) {
    if (isUniqueConflict(error)) return "already_recorded";
    throw error;
  }
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  db: PrismaClient = requirePrisma(),
) {
  if (subscription.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");
  const userId = subscription.metadata?.userId;
  if (!userId) return "ignored";

  await db.billingSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id, userId },
    data: {
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripePriceId: subscription.items.data[0]?.price?.id ?? undefined,
    },
  });
  return "synced";
}

export async function markSubscriptionCanceled(
  subscription: Stripe.Subscription,
  db: PrismaClient = requirePrisma(),
) {
  if (subscription.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");
  await db.billingSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "CANCELED", cancelAtPeriodEnd: false },
  });
  return "canceled";
}
