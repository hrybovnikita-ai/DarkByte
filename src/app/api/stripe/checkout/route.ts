import { withApiHandler } from "@/server/api/with-handler";
import { createSubscriptionCheckout } from "@/server/billing/handlers";

export const POST = withApiHandler(createSubscriptionCheckout);