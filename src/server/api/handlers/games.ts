import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser, requireAdmin } from "@/server/auth/context";
import { gameCreateSchema, gameUpdateSchema } from "@/server/validators/resources";

function lookup(id: string, publishedOnly: boolean): Prisma.GameWhereInput {
  return {
    OR: [{ id }, { slug: id }],
    ...(publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

export async function listGames(request: Request) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const where: Prisma.GameWhereInput = {
    ...(user?.role === "ADMIN" && query.status
      ? { status: query.status }
      : { status: "PUBLISHED" }),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { genre: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      orderBy: { [query.sort ?? "createdAt"]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return apiSuccess(items, { meta: paginationMeta(query.page, query.pageSize, total) });
}

export async function createGame(request: Request) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = gameCreateSchema.parse(await readJsonBody(request));
  return apiCreated(await requirePrisma().game.create({ data: body }));
}

export async function getGame(request: Request, id: string) {
  const user = await getAuthUser(request);
  const row = await requirePrisma().game.findFirst({
    where: lookup(id, user?.role !== "ADMIN"),
  });
  if (!row) throw new Error("NOT_FOUND");
  return apiSuccess(row);
}

export async function putGame(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = gameCreateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().game.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  return apiSuccess(
    await requirePrisma().game.update({ where: { id: existing.id }, data: body }),
  );
}

export async function patchGame(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = gameUpdateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().game.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  return apiSuccess(
    await requirePrisma().game.update({ where: { id: existing.id }, data: body }),
  );
}

export async function deleteGame(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const existing = await requirePrisma().game.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  await requirePrisma().game.delete({ where: { id: existing.id } });
  return apiNoContent();
}