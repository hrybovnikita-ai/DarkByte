import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { fulfillCreditPurchase, spendCredits } from "@/server/credits/ledger";
import { POST as webhook } from "@/app/api/stripe/webhook/route";

const secret = "whsec_local_integration_only";
const stripe = new Stripe("sk_test_local_integration_only");
const db = new PrismaClient();
const users: string[] = [];

describe.skipIf(!process.env.TEST_DATABASE_URL)("credit PostgreSQL transactions + signed webhooks", () => {
  beforeAll(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_local_integration_only");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  });
  afterAll(async () => {
    if (users.length) {
      await db.creditTransaction.deleteMany({ where: { userId: { in: users } } });
      await db.creditPurchase.deleteMany({ where: { userId: { in: users } } });
      await db.creditAccount.deleteMany({ where: { userId: { in: users } } });
      await db.user.deleteMany({ where: { id: { in: users } } });
    }
    await db.$disconnect();
    vi.unstubAllEnvs();
  });

  async function fixture() {
    const user = await db.user.create({ data: { email: "credits-" + randomUUID() + "@test.invalid" } });
    users.push(user.id);
    const purchase = await db.creditPurchase.create({
      data: { userId: user.id, requestKey: randomUUID(), planId: "starter", amountCents: 500, credits: 500 },
    });
    const session = {
      id: "cs_test_" + randomUUID(), object: "checkout.session", mode: "payment", status: "complete",
      payment_status: "paid", livemode: false, currency: "usd", amount_total: 500,
      client_reference_id: user.id, payment_intent: "pi_" + randomUUID(),
      metadata: { purchaseId: purchase.id, userId: user.id, planId: "starter" },
    } as unknown as Stripe.Checkout.Session;
    return { user, purchase, session };
  }

  async function deliver(session: Stripe.Checkout.Session, options: { type?: string; eventId?: string; live?: boolean; signature?: string; timestamp?: number } = {}) {
    const payload = JSON.stringify({ id: options.eventId ?? "evt_" + randomUUID(), object: "event", type: options.type ?? "checkout.session.completed", livemode: options.live ?? false, data: { object: session } });
    const signature = options.signature ?? stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: options.timestamp });
    return webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": signature } }));
  }

  it("verifies a real SDK signature and credits once across concurrent deliveries and different event IDs", async () => {
    const { user, purchase, session } = await fixture();
    const results = await Promise.all(Array.from({ length: 5 }, () => deliver(session)));
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect((await db.creditAccount.findUniqueOrThrow({ where: { userId: user.id } })).balance).toBe(500);
    expect(await db.creditTransaction.count({ where: { userId: user.id } })).toBe(1);
    expect((await db.creditPurchase.findUniqueOrThrow({ where: { id: purchase.id } })).fulfilledAt).not.toBeNull();
  });

  it("does not credit unpaid completion, but credits delayed payment success", async () => {
    const { user, session } = await fixture();
    expect((await deliver({ ...session, payment_status: "unpaid" })).status).toBe(200);
    expect(await db.creditAccount.findUnique({ where: { userId: user.id } })).toBeNull();
    expect((await deliver(session, { type: "checkout.session.async_payment_succeeded" })).status).toBe(200);
    expect((await db.creditAccount.findUniqueOrThrow({ where: { userId: user.id } })).balance).toBe(500);
  });

  it("rejects forged, missing and expired signatures without a ledger entry", async () => {
    const { user, session } = await fixture();
    expect((await deliver(session, { signature: "invalid" })).status).toBe(400);
    expect((await deliver(session, { timestamp: 1 })).status).toBe(400);
    expect((await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" }))).status).toBe(400);
    expect(await db.creditTransaction.count({ where: { userId: user.id } })).toBe(0);
  });

  it("rejects mismatched amounts, currency, identity, session, and live payments", async () => {
    const { user, purchase, session } = await fixture();
    for (const change of [{ amount_total: 1 }, { currency: "eur" }, { client_reference_id: "attacker" }, { metadata: { ...session.metadata, userId: "attacker" } }]) {
      expect((await deliver({ ...session, ...change } as Stripe.Checkout.Session)).status).toBe(400);
    }
    expect((await deliver(session, { live: true })).status).toBe(400);
    await db.creditPurchase.update({ where: { id: purchase.id }, data: { stripeSessionId: "cs_other" } });
    expect((await deliver(session)).status).toBe(400);
    expect(await db.creditTransaction.count({ where: { userId: user.id } })).toBe(0);
  });

  it("rolls back an inserted transaction if the balance update fails, then permits retry", async () => {
    const { user, session } = await fixture();
    await db.creditAccount.create({ data: { userId: user.id, balance: 2_147_483_647 } });
    expect((await deliver(session)).status).toBe(500); // PostgreSQL integer overflow.
    expect(await db.creditTransaction.count({ where: { userId: user.id } })).toBe(0);
    await db.creditAccount.update({ where: { userId: user.id }, data: { balance: 0 } });
    expect((await deliver(session)).status).toBe(200);
    expect((await db.creditAccount.findUniqueOrThrow({ where: { userId: user.id } })).balance).toBe(500);
  });

  it("prevents simultaneous spending from overdrawing, and retries a debit exactly once", async () => {
    const { user, session } = await fixture();
    await fulfillCreditPurchase(session, "evt_" + randomUUID(), db);
    const results = await Promise.allSettled([
      spendCredits(user.id, 400, "op-a", "Generator", db),
      spendCredits(user.id, 400, "op-b", "Generator", db),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const winner = results[0].status === "fulfilled" ? "op-a" : "op-b";
    await spendCredits(user.id, 400, winner, "Generator", db);
    await expect(spendCredits(user.id, 401, winner, "Generator", db)).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    expect((await db.creditAccount.findUniqueOrThrow({ where: { userId: user.id } })).balance).toBe(100);
    const sum = await db.creditTransaction.aggregate({ where: { userId: user.id }, _sum: { amount: true } });
    expect(sum._sum.amount).toBe(100);
  });

  it("enforces nonnegative balances and valid packs inside PostgreSQL", async () => {
    const { user } = await fixture();
    await expect(db.creditAccount.create({ data: { userId: user.id, balance: -1 } })).rejects.toThrow();
    await expect(db.creditPurchase.create({ data: {
      userId: user.id, requestKey: randomUUID(), planId: "ultimate", amountCents: 1, credits: 99999,
    } })).rejects.toThrow();
  });
});
