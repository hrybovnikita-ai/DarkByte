import { NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";
import { withApiHandler } from "@/server/api/with-handler";
import { apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { isAuthFullyConfigured } from "@/server/auth/config";
import { hashPassword } from "@/server/auth/password";
import {
  RESET_PASSWORD_PREFIX,
  consumeVerificationToken,
} from "@/server/auth/tokens";
import { resetPasswordSchema } from "@/server/validators/auth";

async function resetPassword(request: Request) {
  if (!isAuthFullyConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Password reset unavailable — auth not configured.",
          code: "AUTH_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }

  const body = resetPasswordSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();

  const valid = await consumeVerificationToken(
    `${RESET_PASSWORD_PREFIX}${body.email}`,
    body.token,
  );
  if (!valid) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Invalid or expired reset token.", code: "INVALID_TOKEN" },
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Account not found.", code: "NOT_FOUND" },
      },
      { status: 404 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.password) },
  });

  return apiSuccess({ message: "Password updated successfully." });
}

export const POST = withApiHandler(resetPassword);