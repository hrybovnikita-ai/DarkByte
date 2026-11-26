import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import { findCreditPlan } from "@/lib/credit-plans";
import { getAuthUser } from "@/server/auth/context";
import { apiError, apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { checkRateLimitByKey } from "@/server/middleware/rate-limit";
import { checkoutOrigin, getStripe } from "./stripe";

const checkoutSchema = z.object({ planId: z.enum(["starter", "pro", "ultimate"]) }).strict();
const historySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(100).optional(),
});

function privateResponse<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function getCreditBalance(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const account = await requirePrisma().creditAccount.findUnique({ where: { userId: user.id } });
  // No account row is necessary until the user's first successful payment.
  return privateResponse({ balance: account?.balance ?? 0 });
}

export async function getCreditHistory(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const query = historySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const db = requirePrisma();
  const cursor = query.cursor ? await db.creditTransaction.findFirst({
    where: { id: query.cursor, userId: user.id },
    select: { id: true, createdAt: true },
  }) : null;
  if (query.cursor && !cursor) return apiError("Invalid history cursor", 400, "INVALID_CURSOR");
  const items = await db.creditTransaction.findMany({
    where: {
      userId: user.id,
      ...(cursor ? { OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: { id: true, amount: true, kind: true, description: true, createdAt: true, stripeSessionId: true },
  });
  const hasMore = items.length > query.limit;
  const page = items.slice(0, query.limit);
  return privateResponse({ items: page, nextCursor: hasMore ? page.at(-1)!.id : null });
}

export async function createCreditCheckout(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const origin = checkoutOrigin();
  // Cookie-authenticated mutations must originate at this application.
  if (request.headers.get("origin") !== origin) return apiError("Invalid request origin", 403, "FORBIDDEN");
  const { planId } = checkoutSchema.parse(await readJsonBody(request));
  const requestKey = z.uuid().parse(request.headers.get("idempotency-key"));
  const plan = findCreditPlan(planId)!;
  const stripe = getStripe();
  const rate = checkRateLimitByKey("credit-checkout:" + user.id, 30);
  if (!rate.allowed) return apiError("Too many checkout attempts", 429, "RATE_LIMIT");
  const db = requirePrisma();
  const purchase = await db.creditPurchase.upsert({
    where: { userId_requestKey: { userId: user.id, requestKey } },
    create: { userId: user.id, requestKey, planId, amountCents: plan.amountCents, credits: plan.credits, currency: "usd" },
    update: {},
  });
  if (purchase.planId !== planId) return apiError("Use a new checkout key for a different plan", 409, "IDEMPOTENCY_CONFLICT");
  if (purchase.fulfilledAt) return apiError("This purchase is already complete", 409, "CHECKOUT_COMPLETE");
  // Stripe expires idempotency keys after 24h. Never recreate an old order.
  if (!purchase.stripeSessionId && Date.now() - purchase.createdAt.getTime() > 23 * 60 * 60 * 1000) {
    return apiError("Checkout expired. Please try again.", 409, "CHECKOUT_EXPIRED");
  }
  const session = purchase.stripeSessionId
    ? await stripe.checkout.sessions.retrieve(purchase.stripeSessionId)
    : await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      metadata: { purchaseId: purchase.id, userId: user.id, planId },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: purchase.currency,
          unit_amount: purchase.amountCents,
          product_data: { name: "DARKBYTE " + plan.name + " — " + purchase.credits + " credits" },
        },
      }],
      success_url: origin + "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/checkout/cancelled",
    }, { idempotencyKey: "credits:" + purchase.id });
  if (session.livemode) throw new Error("PAYMENTS_NOT_CONFIGURED");
  await db.creditPurchase.update({ where: { id: purchase.id }, data: { stripeSessionId: session.id } });
  if (!session.url || session.status !== "open") return apiError("Checkout expired or completed. Please try again.", 409, "CHECKOUT_EXPIRED");
  return privateResponse({ url: session.url });
}
