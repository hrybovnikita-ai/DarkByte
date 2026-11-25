import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/worlds";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getWorldById(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.replaceWorld(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchWorld(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteWorld(request, id);
});
