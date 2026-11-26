import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as balance } from "@/app/api/credits/balance/route";
import { GET as history } from "@/app/api/credits/history/route";
import { POST as checkout } from "@/app/api/credits/checkout/route";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    creditAccount: { findUnique: vi.fn() },
    creditTransaction: { findFirst: vi.fn(), findMany: vi.fn() },
    creditPurchase: { upsert: vi.fn(), update: vi.fn() },
  },
  stripe: { checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } } },
}));
vi.mock("@/server/auth/context", () => ({ getAuthUser: mocks.auth }));
vi.mock("@/lib/db", () => ({ requirePrisma: () => mocks.db }));
vi.mock("@/server/credits/stripe", () => ({ checkoutOrigin: () => "http://localhost:3000", getStripe: () => mocks.stripe }));
const context = { params: Promise.resolve({}) };
const key = "f8f43967-a70a-4dca-9766-edb7991e4855";
function request(body: unknown = { planId: "starter" }, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/credits/checkout", {
    method: "POST", headers: { origin, "Content-Type": "application/json", "idempotency-key": key }, body: JSON.stringify(body),
  });
}
function purchase(planId = "starter", amountCents = 500, credits = 500) {
  return { id: "order-1", userId: "user-a", requestKey: key, planId, amountCents, credits, currency: "usd", stripeSessionId: null, fulfilledAt: null, createdAt: new Date() };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ id: "user-a" });
  mocks.db.creditAccount.findUnique.mockResolvedValue(null);
  mocks.db.creditTransaction.findMany.mockResolvedValue([]);
  mocks.db.creditTransaction.findFirst.mockResolvedValue(null);
  mocks.db.creditPurchase.upsert.mockResolvedValue(purchase());
  mocks.db.creditPurchase.update.mockResolvedValue({});
  mocks.stripe.checkout.sessions.create.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.com/test", status: "open", livemode: false });
});

describe("credit API authorization and input boundaries", () => {
  it("requires authentication on all three endpoints", async () => {
    mocks.auth.mockRejectedValue(new Error("UNAUTHORIZED"));
    for (const handler of [balance, history, checkout]) {
      expect((await handler(request(), context)).status).toBe(401);
    }
    expect(mocks.db.creditAccount.findUnique).not.toHaveBeenCalled();
    expect(mocks.db.creditPurchase.upsert).not.toHaveBeenCalled();
  });
  it("scopes balance to the authenticated user, with no cached response", async () => {
    const response = await balance(new Request("http://localhost/api/credits/balance?userId=victim"), context);
    expect(await response.json()).toMatchObject({ data: { balance: 0 } });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.db.creditAccount.findUnique).toHaveBeenCalledWith({ where: { userId: "user-a" } });
  });
  it("scopes history and bounds page size", async () => {
    expect((await history(new Request("http://localhost/api/credits/history?limit=51"), context)).status).toBe(400);
    await history(new Request("http://localhost/api/credits/history?userId=victim&limit=2"), context);
    expect(mocks.db.creditTransaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-a" }, take: 3,
    }));
  });
  it("rejects another user's history cursor", async () => {
    expect((await history(new Request("http://localhost/api/credits/history?cursor=foreign"), context)).status).toBe(400);
    expect(mocks.db.creditTransaction.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign", userId: "user-a" } }));
    expect(mocks.db.creditTransaction.findMany).not.toHaveBeenCalled();
  });
  it.each([
    { planId: "free" }, { planId: "starter", credits: 99999 },
    { planId: "starter", amountCents: 1 }, { planId: "starter", userId: "victim" },
    { planId: "starter", priceId: "price_attacker" },
  ])("rejects tampered checkout payload %j", async (body) => {
    expect((await checkout(request(body), context)).status).toBe(400);
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
  it("rejects cross-origin checkout and missing idempotency keys", async () => {
    expect((await checkout(request(undefined, "https://attacker.example"), context)).status).toBe(403);
    const req = request(); req.headers.delete("idempotency-key");
    expect((await checkout(req, context)).status).toBe(400);
    expect(mocks.db.creditPurchase.upsert).not.toHaveBeenCalled();
  });
  it.each([["starter", 500, 500], ["pro", 1500, 2000], ["ultimate", 2500, 5000]] as const)(
    "creates %s checkout with server prices and a stable retry key", async (planId, amountCents, credits) => {
      mocks.db.creditPurchase.upsert.mockResolvedValue(purchase(planId, amountCents, credits));
      expect((await checkout(request({ planId }), context)).status).toBe(200);
      expect(mocks.db.creditPurchase.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ planId, amountCents, credits, userId: "user-a" }),
      }));
      expect(mocks.stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
        mode: "payment", client_reference_id: "user-a",
        line_items: [expect.objectContaining({ quantity: 1, price_data: expect.objectContaining({ unit_amount: amountCents, currency: "usd" }) })],
      }), { idempotencyKey: "credits:order-1" });
    },
  );
  it("reuses an existing session on retry", async () => {
    mocks.db.creditPurchase.upsert.mockResolvedValue({ ...purchase(), stripeSessionId: "cs_test_existing" });
    mocks.stripe.checkout.sessions.retrieve.mockResolvedValue({ id: "cs_test_existing", status: "open", url: "https://checkout.stripe.com/existing" });
    expect((await checkout(request(), context)).status).toBe(200);
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
  it("refuses key reuse with a different plan or an expired creation attempt", async () => {
    mocks.db.creditPurchase.upsert.mockResolvedValue(purchase("pro", 1500, 2000));
    expect((await checkout(request(), context)).status).toBe(409);
    mocks.db.creditPurchase.upsert.mockResolvedValue({ ...purchase(), createdAt: new Date(0) });
    expect((await checkout(request(), context)).status).toBe(409);
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
