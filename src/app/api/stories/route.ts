import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/stories";

export const GET = withApiHandler((request) => handlers.listStories(request));
export const POST = withApiHandler((request) => handlers.createStory(request));
