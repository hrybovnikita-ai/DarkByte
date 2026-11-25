import { withApiHandler } from "@/server/api/with-handler";
import { healthCheck } from "@/server/api/handlers/health";

export const GET = withApiHandler(() => healthCheck());
