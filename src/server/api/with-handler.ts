import { apiError, handleRouteError } from "@/server/api/response";
import { checkRateLimitAsync } from "@/server/middleware/rate-limit";

type RouteContext = { params: Promise<Record<string, string>> };

export function withApiHandler(
  handler: (request: Request, context: RouteContext) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext): Promise<Response> => {
    try {
      const rate = await checkRateLimitAsync(request, "api");
      if (!rate.allowed) {
        const response = apiError("Too many requests", 429, "RATE_LIMIT", {
          retryAfter: rate.retryAfter,
        });
        if (rate.retryAfter) response.headers.set("Retry-After", String(rate.retryAfter));
        return response;
      }
      return await handler(request, context);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PAYLOAD_TOO_LARGE") {
          return apiError("Request body too large", 400, "PAYLOAD_TOO_LARGE");
        }
        if (error.message === "INVALID_JSON") {
          return apiError("Invalid JSON body", 400, "INVALID_JSON");
        }
        if (error.message === "SENSITIVE_FIELD_REJECTED") {
          return apiError("Payment details must not be sent to the server", 400, "SENSITIVE_FIELD_REJECTED");
        }
        if (error.message === "FIREBASE_NOT_CONFIGURED") {
          return apiError(
            "Authentication service is not configured",
            503,
            "AUTH_NOT_CONFIGURED",
          );
        }
      }
      return handleRouteError(error);
    }
  };
}