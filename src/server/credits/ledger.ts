import { Prisma, type PrismaClient } from "@prisma/client";
import type Stripe from "stripe";
import { requirePrisma } from "@/lib/db";

export class PaymentMismatchError extends Error {}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Only call with a session obtained through a verified Stripe webhook. */
export async function fulfillCreditPurchase(
  session: Stripe.Checkout.Session,
  eventId: string,
  db: PrismaClient = requirePrisma(),
) {
  if (session.livemode || session.mode !== "payment" ||
      session.payment_status !== "paid" || session.status !== "complete") return "ignored";

  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) return "ignored"; // Another product on the same Stripe account.
  const purchase = await db.creditPurchase.findUnique({ where: { id: purchaseId } });
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent : session.payment_intent?.id;
  if (!purchase || !paymentIntentId ||
      purchase.userId !== session.client_reference_id ||
      session.metadata?.userId !== purchase.userId ||
      session.metadata?.planId !== purchase.planId ||
      session.amount_total !== purchase.amountCents ||
      session.currency !== purchase.currency ||
      (purchase.stripeSessionId !== null && purchase.stripeSessionId !== session.id)) {
    throw new PaymentMismatchError("Checkout does not match the stored purchase");
  }

  try {
    await db.$transaction(async (tx) => {
      // Unique purchase/session/payment/event IDs arbitrate concurrent deliveries.
      // If any write fails, the ledger entry AND balance change roll back.
      await tx.creditTransaction.create({
        data: {
          userId: purchase.userId,
          amount: purchase.credits,
          kind: "PURCHASE",
          description: purchase.planId + " credit pack",
          idempotencyKey: "purchase:" + purchase.id,
          purchaseId: purchase.id,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeEventId: eventId,
        },
      });
      await tx.creditAccount.upsert({
        where: { userId: purchase.userId },
        create: { userId: purchase.userId, balance: purchase.credits },
        update: { balance: { increment: purchase.credits } },
      });
      await tx.creditPurchase.update({
        where: { id: purchase.id },
        data: { stripeSessionId: session.id, fulfilledAt: new Date() },
      });
    });
    return "credited";
  } catch (error) {
    if (isUniqueConflict(error)) {
      const existing = await db.creditTransaction.findUnique({ where: { purchaseId: purchase.id } });
      if (existing?.stripeSessionId === session.id &&
          existing.stripePaymentIntentId === paymentIntentId) return "already_credited";
    }
    throw error;
  }
}

/** Server-only primitive for future metered tools. Never expose arbitrary debits to clients.
 * A stable operation key makes retries safe; conditional UPDATE prevents concurrent overspending.
 */
const WELCOME_CREDITS = 100;

/** Idempotent server-side credit grants (welcome bonus, dev tooling). */
export async function grantBonusCredits(
  userId: string,
  amount: number,
  operationKey: string,
  description: string,
  db: PrismaClient = requirePrisma(),
) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647 ||
      !operationKey || operationKey.length > 160 || !description || description.length > 200) {
    throw new Error("INVALID_CREDIT_BONUS");
  }
  const idempotencyKey = "bonus:" + userId + ":" + operationKey;
  try {
    return await db.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: { userId, amount, kind: "BONUS", description, idempotencyKey },
      });
      await tx.creditAccount.upsert({
        where: { userId },
        create: { userId, balance: amount },
        update: { balance: { increment: amount } },
      });
      return transaction;
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      const existing = await db.creditTransaction.findUnique({ where: { idempotencyKey } });
      if (existing?.userId === userId && existing.amount === amount) return existing;
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    throw error;
  }
}

export async function grantWelcomeCredits(userId: string, db: PrismaClient = requirePrisma()) {
  return grantBonusCredits(userId, WELCOME_CREDITS, "welcome", "Welcome bonus", db);
}

export async function spendCredits(
  userId: string,
  amount: number,
  operationKey: string,
  description: string,
  db: PrismaClient = requirePrisma(),
) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647 ||
      !operationKey || operationKey.length > 160 || !description || description.length > 200) {
    throw new Error("INVALID_CREDIT_DEBIT");
  }
  const idempotencyKey = "spend:" + userId + ":" + operationKey;
  try {
    return await db.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: { userId, amount: -amount, kind: "SPEND", description, idempotencyKey },
      });
      const updated = await tx.creditAccount.updateMany({
        where: { userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (updated.count !== 1) throw new Error("INSUFFICIENT_CREDITS");
      return transaction;
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      const existing = await db.creditTransaction.findUnique({ where: { idempotencyKey } });
      if (existing?.userId === userId && existing.amount === -amount && existing.description === description) return existing;
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    throw error;
  }
}
