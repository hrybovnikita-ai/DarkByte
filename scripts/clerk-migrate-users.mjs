/**
 * Links existing Neon users to Clerk accounts by verified email on first sign-in.
 * Run after applying the clerkId migration — does not create Clerk users automatically.
 * Usage: node scripts/clerk-migrate-users.mjs
 */
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const { PrismaClient } = await import("@prisma/client");

const prisma = new PrismaClient();
try {
  const pending = await prisma.user.findMany({
    where: { clerkId: null },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Users awaiting Clerk link: ${pending.length}`);
  for (const user of pending.slice(0, 20)) {
    console.log(`  - ${user.email}`);
  }
  if (pending.length > 20) console.log(`  ... and ${pending.length - 20} more`);
  console.log("When each user signs in with Clerk (same email), records are linked automatically.");
} finally {
  await prisma.$disconnect();
}