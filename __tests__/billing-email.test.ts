import { describe, expect, it } from "vitest";
import { renderSubscriptionReceipt } from "@/server/billing/email";

describe("subscription receipt email", () => {
  it("marks test payments and avoids full card numbers", () => {
    const { subject, html } = renderSubscriptionReceipt({
      to: "user@example.com",
      planName: "Pro",
      amountCents: 1500,
      transactionId: "in_test_123",
      status: "Successful",
      paidAt: new Date("2026-01-01T12:00:00.000Z"),
      cardBrand: "visa",
      cardLast4: "4242",
      billingPeriodLabel: "Monthly",
    });
    expect(subject).toContain("[TEST PAYMENT]");
    expect(html).toContain("TEST PAYMENT");
    expect(html).toContain("Visa ···· 4242");
    expect(html).not.toMatch(/4242\s*4242/);
  });
});