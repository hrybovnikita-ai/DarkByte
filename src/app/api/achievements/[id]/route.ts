import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/achievements";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getAchievement(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.putAchievement(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchAchievement(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteAchievement(request, id);
});
