import { handlers, isAuthProvidersConfigured } from "@/auth";
import { isNextAuthOperational } from "@/server/auth/config";
import { NextResponse, type NextRequest } from "next/server";

const { GET: authGet, POST: authPost } = handlers;

export async function GET(request: NextRequest) {
  if (!isNextAuthOperational() || !isAuthProvidersConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Authentication is not configured. Set AUTH_SECRET and DATABASE_URL.",
          code: "AUTH_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }
  return authGet(request);
}

export async function POST(request: NextRequest) {
  if (!isNextAuthOperational() || !isAuthProvidersConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Authentication is not configured. Set AUTH_SECRET and DATABASE_URL.",
          code: "AUTH_NOT_CONFIGURED",
        },
      },
      { status: 503 },
    );
  }
  return authPost(request);
}