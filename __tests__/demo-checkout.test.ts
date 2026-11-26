import { describe, expect, it } from "vitest";
import { newDemoTransactionId } from "@/server/billing/demo/handlers";
import { renderDemoSubscriptionReceipt } from "@/server/billing/demo/email";
import { z } from "zod";

const demoCheckoutSchema = z
  .object({
    planId: z.enum(["starter", "pro", "ultimate"]),
    interval: z.enum(["month", "year"] as const),
    paymentMethod: z.enum(["visa", "mastercard", "google_pay", "apple_pay"]),
  })
  .strict();

describe("demo checkout", () => {
  it("generates unique demo transaction ids", () => {
    const a = newDemoTransactionId();
    const b = newDemoTransactionId();
    expect(a).toMatch(/^demo_txn_/);
    expect(a).not.toBe(b);
  });

  it("rejects card fields in strict payload", () => {
    expect(() =>
      demoCheckoutSchema.parse({ planId: "pro", interval: "month", paymentMethod: "visa", cardNumber: "123" }),
    ).toThrow();
  });

  it("renders demo email without card numbers", () => {
    const { subject, html } = renderDemoSubscriptionReceipt({
      to: "user@example.com",
      planName: "Pro",
      amountCents: 1500,
      transactionId: "demo_txn_abc",
      paymentMethod: "visa",
      billingPeriodLabel: "Monthly",
      paidAt: new Date("2026-01-01T12:00:00.000Z"),
    });
    expect(subject).toContain("[DEMO PAYMENT]");
    expect(html).toContain("DEMO MODE");
    expect(html).not.toMatch(/\d{13,}/);
  });
});