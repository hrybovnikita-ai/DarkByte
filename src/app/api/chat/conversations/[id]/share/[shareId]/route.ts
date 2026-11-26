import { withApiHandler } from "@/server/api/with-handler";
import { revokeConversationShare } from "@/server/api/handlers/chat-actions";
import { handleRouteError } from "@/server/api/response";

export const DELETE = withApiHandler(async (request, context) => {
  const { id, shareId } = await context.params;
  try {
    return await revokeConversationShare(request, id, shareId);
  } catch (error) {
    return handleRouteError(error);
  }
});