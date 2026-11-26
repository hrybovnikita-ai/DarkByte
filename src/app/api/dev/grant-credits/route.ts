import { withApiHandler } from "@/server/api/with-handler";
import { apiError, apiSuccess } from "@/server/api/response";
import { getAuthUser } from "@/server/auth/context";
import { grantBonusCredits } from "@/server/credits/ledger";

async function grantDevCredits(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return apiError("Not available in production", 404, "NOT_FOUND");
  }
  const secret = process.env.DEV_CREDITS_SECRET?.trim();
  if (!secret || request.headers.get("x-dev-credits-secret") !== secret) {
    return apiError("Forbidden", 403, "FORBIDDEN");
  }
  const user = await getAuthUser(request, { required: true });
  await grantBonusCredits(user.id, 100, "dev-test", "Development test credits");
  return apiSuccess({ granted: 100 });
}

export const POST = withApiHandler(grantDevCredits);