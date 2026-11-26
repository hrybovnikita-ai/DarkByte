import { withApiHandler } from "@/server/api/with-handler";
import { branchConversation } from "@/server/api/handlers/chat-actions";

export const POST = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  try {
    return await branchConversation(request, id);
  } catch (error) {
    const { handleRouteError } = await import("@/server/api/response");
    return handleRouteError(error);
  }
});