CREATE TYPE "CreditTransactionKind" AS ENUM ('PURCHASE', 'SPEND');

CREATE TABLE "CreditAccount" (
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "CreditAccount_balance_nonnegative" CHECK ("balance" >= 0)
);

CREATE TABLE "CreditPurchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "credits" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "stripeSessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fulfilledAt" TIMESTAMP(3),
  CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditPurchase_valid_pack" CHECK (
    "currency" = 'usd' AND (
      ("planId" = 'starter' AND "amountCents" = 500 AND "credits" = 500) OR
      ("planId" = 'pro' AND "amountCents" = 1500 AND "credits" = 2000) OR
      ("planId" = 'ultimate' AND "amountCents" = 2500 AND "credits" = 5000)
    )
  )
);

CREATE TABLE "CreditTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "kind" "CreditTransactionKind" NOT NULL,
  "description" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "purchaseId" TEXT,
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditTransaction_valid_entry" CHECK (
    ("kind" = 'PURCHASE' AND "amount" > 0 AND "purchaseId" IS NOT NULL AND
      "stripeSessionId" IS NOT NULL AND "stripePaymentIntentId" IS NOT NULL AND "stripeEventId" IS NOT NULL)
    OR
    ("kind" = 'SPEND' AND "amount" < 0 AND "purchaseId" IS NULL AND
      "stripeSessionId" IS NULL AND "stripePaymentIntentId" IS NULL AND "stripeEventId" IS NULL)
  )
);

CREATE UNIQUE INDEX "CreditPurchase_stripeSessionId_key" ON "CreditPurchase"("stripeSessionId");
CREATE UNIQUE INDEX "CreditPurchase_userId_requestKey_key" ON "CreditPurchase"("userId", "requestKey");
CREATE INDEX "CreditPurchase_userId_createdAt_idx" ON "CreditPurchase"("userId", "createdAt");
CREATE UNIQUE INDEX "CreditTransaction_idempotencyKey_key" ON "CreditTransaction"("idempotencyKey");
CREATE UNIQUE INDEX "CreditTransaction_purchaseId_key" ON "CreditTransaction"("purchaseId");
CREATE UNIQUE INDEX "CreditTransaction_stripeSessionId_key" ON "CreditTransaction"("stripeSessionId");
CREATE UNIQUE INDEX "CreditTransaction_stripePaymentIntentId_key" ON "CreditTransaction"("stripePaymentIntentId");
CREATE UNIQUE INDEX "CreditTransaction_stripeEventId_key" ON "CreditTransaction"("stripeEventId");
CREATE INDEX "CreditTransaction_userId_createdAt_id_idx" ON "CreditTransaction"("userId", "createdAt", "id");

ALTER TABLE "CreditAccount" ADD CONSTRAINT "CreditAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "CreditPurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
