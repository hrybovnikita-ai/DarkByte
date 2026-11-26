ALTER TABLE "CreditTransaction" DROP CONSTRAINT IF EXISTS "CreditTransaction_valid_entry";

ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_valid_entry" CHECK (
  (
    "kind" = 'PURCHASE' AND "amount" > 0 AND "purchaseId" IS NOT NULL AND
      "stripeSessionId" IS NOT NULL AND "stripePaymentIntentId" IS NOT NULL AND "stripeEventId" IS NOT NULL
  )
  OR
  (
    "kind" = 'SPEND' AND "amount" < 0 AND "purchaseId" IS NULL AND
      "stripeSessionId" IS NULL AND "stripePaymentIntentId" IS NULL AND "stripeEventId" IS NULL
  )
  OR
  (
    "kind" = 'BONUS' AND "amount" > 0 AND "purchaseId" IS NULL AND
      "stripeSessionId" IS NULL AND "stripePaymentIntentId" IS NULL AND "stripeEventId" IS NULL
  )
);