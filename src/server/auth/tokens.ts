import { randomBytes } from "node:crypto";
import { requirePrisma } from "@/lib/db";

const HOUR_MS = 60 * 60 * 1000;

export async function createVerificationToken(
  identifier: string,
  ttlHours = 24,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + ttlHours * HOUR_MS);
  const prisma = requirePrisma();

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumeVerificationToken(
  identifier: string,
  token: string,
): Promise<boolean> {
  const prisma = requirePrisma();
  const row = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });
  if (!row || row.expires < new Date()) {
    return false;
  }
  await prisma.verificationToken.delete({
    where: {
      identifier_token: { identifier, token },
    },
  });
  return true;
}

export const VERIFY_EMAIL_PREFIX = "email-verify:";
export const RESET_PASSWORD_PREFIX = "password-reset:";