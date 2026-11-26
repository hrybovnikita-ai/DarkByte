CREATE TABLE "DemoCreditAccount" (
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemoCreditAccount_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "DemoSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "billingPeriod" "BillingPeriod" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "demoCredits" INTEGER NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemoSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoPayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "transactionId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "billingPeriod" "BillingPeriod" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "creditsGranted" INTEGER NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "status" "BillingPaymentStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "receiptSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemoPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DemoPayment_method_check" CHECK (
    "paymentMethod" IN ('visa', 'mastercard', 'google_pay', 'apple_pay')
  ),
  CONSTRAINT "DemoPayment_valid_plan" CHECK (
    ("planId" = 'starter' AND "billingPeriod" = 'MONTH' AND "amountCents" = 500 AND "creditsGranted" = 500) OR
    ("planId" = 'starter' AND "billingPeriod" = 'YEAR' AND "amountCents" = 5000 AND "creditsGranted" = 6000) OR
    ("planId" = 'pro' AND "billingPeriod" = 'MONTH' AND "amountCents" = 1500 AND "creditsGranted" = 2000) OR
    ("planId" = 'pro' AND "billingPeriod" = 'YEAR' AND "amountCents" = 15000 AND "creditsGranted" = 24000) OR
    ("planId" = 'ultimate' AND "billingPeriod" = 'MONTH' AND "amountCents" = 2500 AND "creditsGranted" = 5000) OR
    ("planId" = 'ultimate' AND "billingPeriod" = 'YEAR' AND "amountCents" = 25000 AND "creditsGranted" = 60000)
  )
);

CREATE UNIQUE INDEX "DemoPayment_transactionId_key" ON "DemoPayment"("transactionId");
CREATE UNIQUE INDEX "DemoPayment_userId_requestKey_key" ON "DemoPayment"("userId", "requestKey");
CREATE INDEX "DemoPayment_userId_createdAt_idx" ON "DemoPayment"("userId", "createdAt");
CREATE INDEX "DemoSubscription_userId_status_idx" ON "DemoSubscription"("userId", "status");

ALTER TABLE "DemoCreditAccount" ADD CONSTRAINT "DemoCreditAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoSubscription" ADD CONSTRAINT "DemoSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoPayment" ADD CONSTRAINT "DemoPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoPayment" ADD CONSTRAINT "DemoPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "DemoSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;