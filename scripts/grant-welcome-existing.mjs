import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const users = await prisma.user.findMany({ select: { id: true, email: true } });
let granted = 0;
for (const user of users) {
  const existing = await prisma.creditTransaction.findUnique({
    where: { idempotencyKey: `bonus:${user.id}:welcome` },
  });
  if (existing) continue;
  await prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        kind: "BONUS",
        description: "Welcome bonus",
        idempotencyKey: `bonus:${user.id}:welcome`,
      },
    });
    await tx.creditAccount.upsert({
      where: { userId: user.id },
      create: { userId: user.id, balance: 100 },
      update: { balance: { increment: 100 } },
    });
  });
  granted++;
  console.log("Granted welcome credits:", user.email);
}
console.log("Done. New grants:", granted);
await prisma.$disconnect();