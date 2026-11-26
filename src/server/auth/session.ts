import { getToken } from "next-auth/jwt";
import { auth } from "@/auth";
import { isAuthSecretConfigured } from "@/server/auth/config";
import { secureAuthCookiesEnabled } from "@/server/auth/cookies";

export { secureAuthCookiesEnabled } from "@/server/auth/cookies";

export async function readAuthTokenFromRequest(request: Request) {
  if (!isAuthSecretConfigured()) return null;
  const secureCookie = secureAuthCookiesEnabled();
  return getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });
}

export async function readAuthSession() {
  if (!isAuthSecretConfigured()) return null;
  try {
    return await auth();
  } catch {
    return null;
  }
}