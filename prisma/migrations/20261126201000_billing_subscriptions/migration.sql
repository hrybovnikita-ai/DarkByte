ALTER TABLE "CreditTransaction" ADD COLUMN "stripeInvoiceId" TEXT;

CREATE UNIQUE INDEX "CreditTransaction_stripeInvoiceId_key" ON "CreditTransaction"("stripeInvoiceId");

ALTER TABLE "CreditTransaction" DROP CONSTRAINT IF EXISTS "CreditTransaction_valid_entry";

ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_valid_entry" CHECK (
  (
    "kind" = 'PURCHASE' AND "amount" > 0 AND "purchaseId" IS NOT NULL AND
      "stripeSessionId" IS NOT NULL AND "stripePaymentIntentId" IS NOT NULL AND "stripeEventId" IS NOT NULL AND
      "stripeInvoiceId" IS NULL
  )
  OR
  (
    "kind" = 'SPEND' AND "amount" < 0 AND "purchaseId" IS NULL AND
      "stripeSessionId" IS NULL AND "stripePaymentIntentId" IS NULL AND "stripeEventId" IS NULL AND
      "stripeInvoiceId" IS NULL
  )
  OR
  (
    "kind" = 'BONUS' AND "amount" > 0 AND "purchaseId" IS NULL AND
      "stripeSessionId" IS NULL AND "stripePaymentIntentId" IS NULL AND "stripeEventId" IS NULL AND
      "stripeInvoiceId" IS NULL
  )
  OR
  (
    "kind" = 'SUBSCRIPTION' AND "amount" > 0 AND "purchaseId" IS NULL AND
      "stripeSessionId" IS NULL AND "stripeInvoiceId" IS NOT NULL AND "stripeEventId" IS NOT NULL AND
      "amount" IN (500, 2000, 5000, 6000, 24000, 60000)
  )
);

CREATE TYPE "BillingPeriod" AS ENUM ('MONTH', 'YEAR');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

CREATE TABLE "BillingCustomer" (
  "userId" TEXT NOT NULL,
  "stripeCustomerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "BillingCheckout" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "billingPeriod" "BillingPeriod" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "credits" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "stripePriceId" TEXT NOT NULL,
  "stripeSessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingCheckout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BillingCheckout_valid_plan" CHECK (
    "currency" = 'usd' AND LEFT("stripePriceId", 6) = 'price_' AND (
      ("planId" = 'starter' AND "billingPeriod" = 'MONTH' AND "amountCents" = 500 AND "credits" = 500) OR
      ("planId" = 'starter' AND "billingPeriod" = 'YEAR' AND "amountCents" = 5000 AND "credits" = 6000) OR
      ("planId" = 'pro' AND "billingPeriod" = 'MONTH' AND "amountCents" = 1500 AND "credits" = 2000) OR
      ("planId" = 'pro' AND "billingPeriod" = 'YEAR' AND "amountCents" = 15000 AND "credits" = 24000) OR
      ("planId" = 'ultimate' AND "billingPeriod" = 'MONTH' AND "amountCents" = 2500 AND "credits" = 5000) OR
      ("planId" = 'ultimate' AND "billingPeriod" = 'YEAR' AND "amountCents" = 25000 AND "credits" = 60000)
    )
  )
);

CREATE TABLE "BillingSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "billingPeriod" "BillingPeriod" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
  "stripeCustomerId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingPayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "checkoutId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "planId" TEXT NOT NULL,
  "billingPeriod" "BillingPeriod" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "credits" INTEGER NOT NULL DEFAULT 0,
  "status" "BillingPaymentStatus" NOT NULL,
  "stripeInvoiceId" TEXT NOT NULL,
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeEventId" TEXT,
  "cardBrand" TEXT,
  "cardLast4" TEXT,
  "failureCode" TEXT,
  "creditsGrantedAt" TIMESTAMP(3),
  "receiptSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BillingPayment_valid_plan" CHECK (
    "currency" = 'usd' AND (
      ("planId" = 'starter' AND "billingPeriod" = 'MONTH' AND "amountCents" = 500 AND "credits" IN (0, 500)) OR
      ("planId" = 'starter' AND "billingPeriod" = 'YEAR' AND "amountCents" = 5000 AND "credits" IN (0, 6000)) OR
      ("planId" = 'pro' AND "billingPeriod" = 'MONTH' AND "amountCents" = 1500 AND "credits" IN (0, 2000)) OR
      ("planId" = 'pro' AND "billingPeriod" = 'YEAR' AND "amountCents" = 15000 AND "credits" IN (0, 24000)) OR
      ("planId" = 'ultimate' AND "billingPeriod" = 'MONTH' AND "amountCents" = 2500 AND "credits" IN (0, 5000)) OR
      ("planId" = 'ultimate' AND "billingPeriod" = 'YEAR' AND "amountCents" = 25000 AND "credits" IN (0, 60000))
    )
  ),
  CONSTRAINT "BillingPayment_card_safe" CHECK (
    ("cardLast4" IS NULL OR "cardLast4" ~ '^[0-9]{4}$')
    AND ("cardBrand" IS NULL OR "cardBrand" IN ('visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay', 'unknown'))
    AND ("failureCode" IS NULL OR "failureCode" ~ '^[A-Za-z0-9_-]{1,64}$')
    AND ("status" <> 'SUCCEEDED' OR "credits" > 0)
  )
);

CREATE UNIQUE INDEX "BillingCustomer_stripeCustomerId_key" ON "BillingCustomer"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingCheckout_stripeSessionId_key" ON "BillingCheckout"("stripeSessionId");
CREATE UNIQUE INDEX "BillingCheckout_userId_requestKey_key" ON "BillingCheckout"("userId", "requestKey");
CREATE INDEX "BillingCheckout_userId_createdAt_idx" ON "BillingCheckout"("userId", "createdAt");
CREATE UNIQUE INDEX "BillingSubscription_stripeSubscriptionId_key" ON "BillingSubscription"("stripeSubscriptionId");
CREATE INDEX "BillingSubscription_userId_status_idx" ON "BillingSubscription"("userId", "status");
CREATE INDEX "BillingSubscription_stripeCustomerId_idx" ON "BillingSubscription"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingPayment_stripeInvoiceId_key" ON "BillingPayment"("stripeInvoiceId");
CREATE UNIQUE INDEX "BillingPayment_stripeSessionId_key" ON "BillingPayment"("stripeSessionId");
CREATE UNIQUE INDEX "BillingPayment_stripePaymentIntentId_key" ON "BillingPayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "BillingPayment_stripeEventId_key" ON "BillingPayment"("stripeEventId");
CREATE INDEX "BillingPayment_userId_createdAt_idx" ON "BillingPayment"("userId", "createdAt");
CREATE INDEX "BillingPayment_checkoutId_idx" ON "BillingPayment"("checkoutId");

ALTER TABLE "BillingCustomer" ADD CONSTRAINT "BillingCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingCheckout" ADD CONSTRAINT "BillingCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "BillingCheckout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BillingSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
