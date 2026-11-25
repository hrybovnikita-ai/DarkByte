import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/users";

export const GET = withApiHandler((request) => handlers.getCurrentUser(request));
export const PATCH = withApiHandler((request) => handlers.patchCurrentUser(request));
