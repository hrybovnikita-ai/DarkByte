import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/games";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getGame(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.putGame(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchGame(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteGame(request, id);
});
