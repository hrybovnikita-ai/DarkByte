import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  isAuthFullyConfigured,
  isEmailServiceConfigured,
  isGoogleOAuthConfigured,
  isNextAuthOperational,
} from "@/server/auth/config";
import { apiSuccess } from "@/server/api/response";
import { getAuthProviderMode, isClerkConfigured, isUpstashRedisConfigured } from "@/server/auth/provider";

export async function healthCheck() {
  const databaseConfigured = isDatabaseConfigured();
  let databaseConnected = false;

  if (databaseConfigured) {
    try {
      const prisma = getPrisma();
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        databaseConnected = true;
      }
    } catch {
      databaseConnected = false;
    }
  }

  return apiSuccess({
    status: "ok",
    version: "3.0.0",
    database: {
      configured: databaseConfigured,
      connected: databaseConnected,
    },
    auth: {
      authConfigured: getAuthProviderMode() === "clerk" ? isClerkConfigured() : isAuthFullyConfigured(),
      nextAuthOperational: getAuthProviderMode() === "authjs" && isNextAuthOperational(),
      googleOAuthConfigured: isGoogleOAuthConfigured(),
      emailConfigured: isEmailServiceConfigured(),
      provider: getAuthProviderMode(),
      clerkConfigured: isClerkConfigured(),
      upstashRedisConfigured: isUpstashRedisConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
}