import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { withApiHandler } from "@/server/api/with-handler";
import { apiConflict, apiCreated } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import {
  isAuthFullyConfigured,
  isEmailServiceConfigured,
} from "@/server/auth/config";
import {
  sendAuthEmail,
  verificationEmailHtml,
} from "@/server/auth/mailer";
import { hashPassword } from "@/server/auth/password";
import {
  VERIFY_EMAIL_PREFIX,
  createVerificationToken,
} from "@/server/auth/tokens";
import { registerSchema } from "@/server/validators/auth";
import { grantWelcomeCredits } from "@/server/credits/ledger";
import { isClerkAuthEnabled } from "@/server/auth/provider";
import { apiError } from "@/server/api/response";

async function register(request: Request) {
  if (isClerkAuthEnabled()) {
    return apiError("Registration is handled by Clerk", 410, "AUTH_PROVIDER_CLERK");
  }

  if (!isAuthFullyConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Registration unavailable. Configure AUTH_SECRET and DATABASE_URL.",
          code: "AUTH_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }

  const body = registerSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return apiConflict("An account with this email already exists.");
  }

  const bootstrapEmail = process.env.DARKBYTE_BOOTSTRAP_ADMIN_EMAIL;
  const role: Role =
    bootstrapEmail &&
    body.email.toLowerCase() === bootstrapEmail.toLowerCase()
      ? "ADMIN"
      : "USER";

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  await grantWelcomeCredits(user.id, prisma).catch(() => undefined);

  let emailVerified = false;
  let mail: Awaited<ReturnType<typeof sendAuthEmail>> = {
    sent: false,
    reason: "EMAIL_NOT_CONFIGURED",
  };

  if (isEmailServiceConfigured()) {
    const token = await createVerificationToken(
      `${VERIFY_EMAIL_PREFIX}${body.email}`,
    );
    mail = await sendAuthEmail(
      body.email,
      "Verify your DARKBYTE account",
      verificationEmailHtml(token, body.email),
    );
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    emailVerified = true;
  }

  return apiCreated({
    user: {
      ...user,
      ...(emailVerified ? { emailVerified: new Date().toISOString() } : {}),
    },
    emailVerification: {
      required: !emailVerified,
      emailSent: mail.sent,
      autoVerifiedWithoutEmail: emailVerified,
      ...(mail.sent === false && !emailVerified ? { reason: mail.reason } : {}),
    },
    ...(emailVerified
      ? {
          notice:
            "Email service is not configured. Account marked verified for local sign-in only.",
        }
      : {}),
  });
}

export const POST = withApiHandler(register);