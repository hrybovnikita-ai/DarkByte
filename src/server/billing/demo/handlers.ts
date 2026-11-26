import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import {
  BILLING_PERIODS,
  findSubscriptionPlan,
  prismaBillingPeriod,
  publicBillingPeriod,
  subscriptionOffer,
} from "@/lib/subscription-plans";
import { getAuthUser } from "@/server/auth/context";
import { apiError, apiSuccess } from "@/server/api/response";
import { checkoutOrigin } from "@/server/credits/stripe";
import { readJsonBody } from "@/server/middleware/request";
import { checkRateLimitByKey } from "@/server/middleware/rate-limit";
import { sendDemoSubscriptionReceipt } from "./email";

const PAYMENT_METHODS = ["visa", "mastercard", "google_pay", "apple_pay"] as const;

const demoCheckoutSchema = z
  .object({
    planId: z.enum(["starter", "pro", "ultimate"]),
    interval: z.enum(BILLING_PERIODS),
    paymentMethod: z.enum(PAYMENT_METHODS),
  })
  .strict();

const SENSITIVE_KEY = /card|pan|cvc|cvv|expir|account.?number|billing.?email/i;

function rejectSensitivePayloadKeys(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (SENSITIVE_KEY.test(key)) throw new Error("SENSITIVE_FIELD_REJECTED");
  }
}

function privateResponse<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function periodEnd(from: Date, period: "MONTH" | "YEAR") {
  const end = new Date(from);
  if (period === "MONTH") end.setUTCDate(end.getUTCDate() + 30);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end;
}

function periodLabel(period: "MONTH" | "YEAR") {
  return period === "MONTH" ? "Monthly" : "Yearly";
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function newDemoTransactionId() {
  return `demo_txn_${randomUUID().replace(/-/g, "")}`;
}

export async function processDemoCheckout(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const origin = checkoutOrigin();
  if (request.headers.get("origin") !== origin) return apiError("Invalid request origin", 403, "FORBIDDEN");

  const rawBody = await readJsonBody(request);
  rejectSensitivePayloadKeys(rawBody);
  const { planId, interval, paymentMethod } = demoCheckoutSchema.parse(rawBody);
  const requestKey = z.uuid().parse(request.headers.get("idempotency-key"));

  const rate = checkRateLimitByKey("demo-checkout:" + user.id, 20);
  if (!rate.allowed) return apiError("Too many demo checkout attempts", 429, "RATE_LIMIT");

  const offer = subscriptionOffer(planId, interval);
  if (!offer) return apiError("Unknown plan", 400, "INVALID_PLAN");

  const billingPeriod = prismaBillingPeriod(interval);
  const plan = findSubscriptionPlan(planId)!;
  const db = requirePrisma();
  const transactionId = newDemoTransactionId();

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.demoPayment.findUnique({
        where: { userId_requestKey: { userId: user.id, requestKey } },
      });
      if (existing) {
        return {
          transactionId: existing.transactionId,
          paymentId: existing.id,
          alreadyProcessed: true as const,
        };
      }

      await tx.demoSubscription.updateMany({
        where: { userId: user.id, status: "ACTIVE" },
        data: { status: "CANCELED" },
      });

      const subscription = await tx.demoSubscription.create({
        data: {
          userId: user.id,
          planId,
          billingPeriod,
          status: "ACTIVE",
          demoCredits: offer.credits,
          currentPeriodEnd: periodEnd(new Date(), billingPeriod),
        },
      });

      const payment = await tx.demoPayment.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          transactionId,
          requestKey,
          planId,
          billingPeriod,
          amountCents: offer.amountCents,
          creditsGranted: offer.credits,
          paymentMethod,
          status: "SUCCEEDED",
        },
      });

      await tx.demoCreditAccount.upsert({
        where: { userId: user.id },
        create: { userId: user.id, balance: offer.credits },
        update: { balance: { increment: offer.credits } },
      });

      return {
        transactionId: payment.transactionId,
        paymentId: payment.id,
        alreadyProcessed: false as const,
      };
    });

    if (!result.alreadyProcessed) {
      const sent = await sendDemoSubscriptionReceipt({
        to: user.email,
        planName: plan.name,
        amountCents: offer.amountCents,
        transactionId: result.transactionId,
        paymentMethod,
        billingPeriodLabel: periodLabel(billingPeriod),
        paidAt: new Date(),
      });
      if (sent.sent) {
        await db.demoPayment.update({
          where: { id: result.paymentId },
          data: { receiptSentAt: new Date() },
        });
      }
    }

    return privateResponse({
      transactionId: result.transactionId,
      planId,
      interval,
      planName: plan.name,
      amountCents: offer.amountCents,
      demoCreditsGranted: offer.credits,
      paymentMethod,
      status: "SUCCEEDED",
      isolated: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SENSITIVE_FIELD_REJECTED") {
      return apiError("Payment details must not be sent to the server", 400, "SENSITIVE_FIELD_REJECTED");
    }
    if (isUniqueConflict(error)) {
      const row = await db.demoPayment.findUnique({
        where: { userId_requestKey: { userId: user.id, requestKey } },
      });
      if (row) {
        return privateResponse({
          transactionId: row.transactionId,
          planId: row.planId,
          interval: publicBillingPeriod(row.billingPeriod),
          status: row.status,
          isolated: true,
        });
      }
    }
    throw error;
  }
}

export async function getDemoBillingStatus(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const db = requirePrisma();

  const subscription = await db.demoSubscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });

  const account = await db.demoCreditAccount.findUnique({ where: { userId: user.id } });

  const payments = await db.demoPayment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      transactionId: true,
      planId: true,
      billingPeriod: true,
      amountCents: true,
      creditsGranted: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
      receiptSentAt: true,
    },
  });

  const plan = subscription ? findSubscriptionPlan(subscription.planId) : null;

  return privateResponse({
    isolated: true,
    demoCreditBalance: account?.balance ?? 0,
    subscription: subscription
      ? {
          planId: subscription.planId,
          planName: plan?.name ?? subscription.planId,
          billingPeriod: publicBillingPeriod(subscription.billingPeriod),
          status: subscription.status,
          demoCredits: subscription.demoCredits,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
    payments: payments.map((payment) => ({
      id: payment.id,
      transactionId: payment.transactionId,
      planId: payment.planId,
      planName: findSubscriptionPlan(payment.planId)?.name ?? payment.planId,
      billingPeriod: publicBillingPeriod(payment.billingPeriod),
      amountCents: payment.amountCents,
      creditsGranted: payment.creditsGranted,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      receiptSent: payment.receiptSentAt !== null,
    })),
  });
}