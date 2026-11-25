import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/secret-files";

export const GET = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.getSecretFile(request, id);
});

export const PUT = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.putSecretFile(request, id);
});

export const PATCH = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.patchSecretFile(request, id);
});

export const DELETE = withApiHandler(async (request, context) => {
  const { id } = await context.params;
  return handlers.deleteSecretFile(request, id);
});
