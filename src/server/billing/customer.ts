import type { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";
import { requirePrisma } from "@/lib/db";
import type { AuthUser } from "@/server/auth/context";

export async function ensureStripeCustomer(
  stripe: Stripe,
  user: AuthUser,
  db: PrismaClient = requirePrisma(),
) {
  const existing = await db.billingCustomer.findUnique({ where: { userId: user.id } });
  if (existing) return existing.stripeCustomerId;

  const customer = await stripe.customers.create(
    {
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    },
    { idempotencyKey: `billing-customer:${user.id}` },
  );

  try {
    await db.billingCustomer.create({
      data: { userId: user.id, stripeCustomerId: customer.id },
    });
  } catch (error) {
    const row = await db.billingCustomer.findUnique({ where: { userId: user.id } });
    if (row) return row.stripeCustomerId;
    throw error;
  }
  return customer.id;
}