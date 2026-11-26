import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { readAuthTokenFromRequest } from "@/server/auth/session";

const isClerk =
  process.env.AUTH_PROVIDER === "clerk" &&
  Boolean(process.env.CLERK_SECRET_KEY?.trim() && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());

const isProtectedRoute = createRouteMatcher([
  "/chat",
  "/chat/",
  "/account(.*)",
  "/admin(.*)",
  "/checkout/success(.*)",
]);

async function legacyProxy(request: NextRequest) {
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

const clerkProxy = clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;
  if (
    path === "/sign-in" ||
    path.startsWith("/sign-in/") ||
    path === "/sign-up" ||
    path.startsWith("/sign-up/") ||
    path.startsWith("/chat/shared") ||
    path.startsWith("/api/webhooks/clerk")
  ) {
    return;
  }
  if (path === "/chat" || (path.startsWith("/chat/") && !path.startsWith("/chat/shared"))) {
    await auth.protect();
    return;
  }
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const proxy = isClerk ? clerkProxy : legacyProxy;

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};