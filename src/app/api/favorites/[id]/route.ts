import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/favorites";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getFavorite(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteFavorite(request, id);
});
