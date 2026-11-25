import { withApiHandler } from "@/server/api/with-handler";
import { listCompanies } from "@/server/api/handlers/companies";

export const GET = withApiHandler((request) => listCompanies(request));