import { NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";
import { withApiHandler } from "@/server/api/with-handler";
import { apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import {
  isAuthFullyConfigured,
  isEmailServiceConfigured,
} from "@/server/auth/config";
import {
  resetPasswordEmailHtml,
  sendAuthEmail,
} from "@/server/auth/mailer";
import {
  RESET_PASSWORD_PREFIX,
  createVerificationToken,
} from "@/server/auth/tokens";
import { forgotPasswordSchema } from "@/server/validators/auth";

async function forgotPassword(request: Request) {
  if (!isAuthFullyConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Password recovery unavailable — auth not configured.",
          code: "AUTH_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }

  if (!isEmailServiceConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Password recovery email is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM.",
          code: "EMAIL_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }

  const { email } = forgotPasswordSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    const token = await createVerificationToken(
      `${RESET_PASSWORD_PREFIX}${email}`,
      2,
    );
    await sendAuthEmail(
      email,
      "Reset your DARKBYTE password",
      resetPasswordEmailHtml(token),
    );
  }

  return apiSuccess({
    message:
      "If an account exists for this email, a password reset link has been sent.",
  });
}

export const POST = withApiHandler(forgotPassword);