import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/monsters";

export const GET = withApiHandler((request) => handlers.listMonsters(request));
export const POST = withApiHandler((request) => handlers.createMonster(request));
