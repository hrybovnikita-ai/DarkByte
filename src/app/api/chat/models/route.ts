import { withApiHandler } from "@/server/api/with-handler";
import { listChatModels } from "@/server/api/handlers/chat";

export const GET = withApiHandler((request) => listChatModels(request));