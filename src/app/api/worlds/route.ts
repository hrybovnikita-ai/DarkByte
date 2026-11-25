import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/worlds";

export const GET = withApiHandler((request) => handlers.listWorlds(request));
export const POST = withApiHandler((request) => handlers.createWorld(request));
