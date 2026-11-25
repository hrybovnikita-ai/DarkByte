import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/pixel-projects";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getPixelProject(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.putPixelProject(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchPixelProject(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deletePixelProject(request, id);
});
