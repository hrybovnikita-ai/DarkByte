import { withApiHandler } from "@/server/api/with-handler";
import { safeUpsertMessageFeedback } from "@/server/api/handlers/chat-actions";

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return safeUpsertMessageFeedback(request, id);
});