import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/games";

export const GET = withApiHandler((request) => handlers.listGames(request));
export const POST = withApiHandler((request) => handlers.createGame(request));
