import { withApiHandler } from "@/server/api/with-handler";
import { deleteConversation, getConversation, patchConversation } from "@/server/api/handlers/chat";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return getConversation(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return patchConversation(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return deleteConversation(request, id);
});