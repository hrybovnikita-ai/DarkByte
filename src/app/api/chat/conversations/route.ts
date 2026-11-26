import { withApiHandler } from "@/server/api/with-handler";
import { createConversation, listConversations } from "@/server/api/handlers/chat";

export const GET = withApiHandler((request) => listConversations(request));
export const POST = withApiHandler((request) => createConversation(request));