import { NextResponse, type NextRequest } from "next/server";
import { readAuthTokenFromRequest } from "@/server/auth/session";

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!process.env.AUTH_SECRET) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const token = await readAuthTokenFromRequest(request);

  if (!token?.sub) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};