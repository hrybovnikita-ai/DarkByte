import { NextResponse } from "next/server";
import { requirePrisma } from "@/lib/db";
import { withApiHandler } from "@/server/api/with-handler";
import { apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { isAuthFullyConfigured } from "@/server/auth/config";
import {
  VERIFY_EMAIL_PREFIX,
  consumeVerificationToken,
} from "@/server/auth/tokens";
import { verifyEmailSchema } from "@/server/validators/auth";

async function verifyEmailPost(request: Request) {
  if (!isAuthFullyConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Email verification unavailable — auth not configured.",
          code: "AUTH_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }

  const body = verifyEmailSchema.parse(await readJsonBody(request));
  const valid = await consumeVerificationToken(
    `${VERIFY_EMAIL_PREFIX}${body.email}`,
    body.token,
  );

  if (!valid) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Invalid or expired verification token.", code: "INVALID_TOKEN" },
      },
      { status: 400 },
    );
  }

  const prisma = requirePrisma();
  await prisma.user.update({
    where: { email: body.email },
    data: { emailVerified: new Date() },
  });

  return apiSuccess({ verified: true });
}

async function verifyEmailGet(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/sign-in?verify=missing", url.origin));
  }

  const synthetic = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, email }),
  });

  const response = await verifyEmailPost(synthetic);
  if (response.ok) {
    return NextResponse.redirect(new URL("/sign-in?verified=1", url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in?verify=invalid", url.origin));
}

export const GET = withApiHandler(verifyEmailGet);
export const POST = withApiHandler(verifyEmailPost);