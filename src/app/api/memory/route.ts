import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/memory";

export const GET = withApiHandler((request) => handlers.listMemory(request));
export const DELETE = withApiHandler((request) => handlers.deleteMemory(request));