import { withApiHandler } from "@/server/api/with-handler";
import * as handlers from "@/server/api/handlers/secret-files";

export const GET = withApiHandler((request) => handlers.listSecretFiles(request));
export const POST = withApiHandler((request) => handlers.createSecretFile(request));
