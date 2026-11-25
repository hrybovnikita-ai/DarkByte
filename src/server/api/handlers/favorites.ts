import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser } from "@/server/auth/context";
import { favoriteCreateSchema } from "@/server/validators/resources";

export async function listFavorites(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const where: Prisma.FavoriteWhereInput = { userId: user.id };

  const [total, items] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return apiSuccess(items, { meta: paginationMeta(query.page, query.pageSize, total) });
}

export async function createFavorite(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const body = favoriteCreateSchema.parse(await readJsonBody(request));
  try {
    const created = await requirePrisma().favorite.create({
      data: {
        userId: user.id,
        targetType: body.targetType,
        targetId: body.targetId,
      },
    });
    return apiCreated(created);
  } catch {
    throw new Error("CONFLICT");
  }
}

export async function getFavorite(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const row = await requirePrisma().favorite.findUnique({ where: { id } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.userId !== user.id) throw new Error("FORBIDDEN");
  return apiSuccess(row);
}

export async function deleteFavorite(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const row = await requirePrisma().favorite.findUnique({ where: { id } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.userId !== user.id) throw new Error("FORBIDDEN");
  await requirePrisma().favorite.delete({ where: { id } });
  return apiNoContent();
}