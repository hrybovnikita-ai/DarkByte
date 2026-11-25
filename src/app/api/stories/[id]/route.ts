import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/stories";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getStory(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.putStory(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchStory(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteStory(request, id);
});
