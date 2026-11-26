import { withApiHandler } from "@/server/api/with-handler";
import { getCreditBalance } from "@/server/credits/handlers";

export const GET = withApiHandler(getCreditBalance);
