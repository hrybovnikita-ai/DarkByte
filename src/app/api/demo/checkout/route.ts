import { withApiHandler } from "@/server/api/with-handler";
import { processDemoCheckout } from "@/server/billing/demo/handlers";

export const POST = withApiHandler(processDemoCheckout);