import { withApiHandler } from "@/server/api/with-handler";
import { createEmbeddedStripeCheckout } from "@/server/billing/embedded-handlers";

export const POST = withApiHandler(createEmbeddedStripeCheckout);