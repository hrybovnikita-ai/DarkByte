import { withApiHandler } from "@/server/api/with-handler";
import { createCreditCheckout } from "@/server/credits/handlers";

export const POST = withApiHandler(createCreditCheckout);
