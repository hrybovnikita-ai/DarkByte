import { getSharedConversation } from "@/server/api/handlers/chat-actions";
import { handleRouteError } from "@/server/api/response";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    return await getSharedConversation(request, token);
  } catch (error) {
    return handleRouteError(error);
  }
}