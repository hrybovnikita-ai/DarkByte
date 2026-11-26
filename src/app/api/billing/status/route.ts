import { withApiHandler } from "@/server/api/with-handler";
import { getBillingStatus } from "@/server/billing/handlers";

export const GET = withApiHandler(getBillingStatus);