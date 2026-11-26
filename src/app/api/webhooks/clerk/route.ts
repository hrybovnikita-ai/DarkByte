import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { requirePrisma } from "@/lib/db";
import { isClerkAuthEnabled } from "@/server/auth/provider";
import { linkOrCreateUserFromClerk } from "@/server/auth/clerk-sync";
import { apiError, apiSuccess } from "@/server/api/response";

export async function POST(request: NextRequest) {
  if (!isClerkAuthEnabled()) {
    return apiError("Clerk auth is disabled", 404, "NOT_FOUND");
  }

  const signingSecret = process.env.CLERK_WEBHOOK_SECRET?.trim();
  if (!signingSecret) {
    return apiError("Webhook secret is not configured", 503, "WEBHOOK_NOT_CONFIGURED");
  }

  let event: WebhookEvent;
  try {
    event = await verifyWebhook(request, { signingSecret });
  } catch {
    return apiError("Invalid Clerk webhook signature", 400, "INVALID_SIGNATURE");
  }

  const prisma = requirePrisma();

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(event.data.id);
      await linkOrCreateUserFromClerk(clerkUser);
    }

    if (event.type === "user.deleted") {
      const clerkId = event.data.id;
      if (clerkId) {
        await prisma.user.updateMany({
          where: { clerkId },
          data: { clerkId: null },
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook sync failed";
    return apiError(message, 409, "SYNC_FAILED");
  }

  return apiSuccess({ received: true });
}