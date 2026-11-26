import { withApiHandler } from "@/server/api/with-handler";
import { getCreditHistory } from "@/server/credits/handlers";

export const GET = withApiHandler(getCreditHistory);
