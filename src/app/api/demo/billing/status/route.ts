import { withApiHandler } from "@/server/api/with-handler";
import { getDemoBillingStatus } from "@/server/billing/demo/handlers";

export const GET = withApiHandler(getDemoBillingStatus);