import { withApiHandler } from "@/server/api/with-handler";
import { createConversationShare, listConversationShares } from "@/server/api/handlers/chat-actions";
import { handleRouteError } from "@/server/api/response";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  try {
    return await listConversationShares(request, id);
  } catch (error) {
    return handleRouteError(error);
  }
});

export const POST = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  try {
    return await createConversationShare(request, id);
  } catch (error) {
    return handleRouteError(error);
  }
});