import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/favorites";

export const GET = withApiHandler((request) => handlers.listFavorites(request));
export const POST = withApiHandler((request) => handlers.createFavorite(request));
