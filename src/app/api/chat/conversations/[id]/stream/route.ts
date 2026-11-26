import { safeStreamConversationMessage } from "@/server/api/handlers/chat";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return safeStreamConversationMessage(request, id);
}