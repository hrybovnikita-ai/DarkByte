import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/pixel-projects";

export const GET = withApiHandler((request) => handlers.listPixelProjects(request));
export const POST = withApiHandler((request) => handlers.createPixelProject(request));
