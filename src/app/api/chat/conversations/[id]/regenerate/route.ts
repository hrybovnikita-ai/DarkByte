import { withApiHandler } from "@/server/api/with-handler";
import { safeRegenerateAssistantMessage } from "@/server/api/handlers/chat-actions";

export const POST = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return safeRegenerateAssistantMessage(request, id);
});