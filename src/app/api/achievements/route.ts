import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/achievements";

export const GET = withApiHandler((request) => handlers.listAchievements(request));
export const POST = withApiHandler((request) => handlers.createAchievement(request));
