import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/monsters";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getMonster(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.putMonster(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchMonster(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteMonster(request, id);
});
