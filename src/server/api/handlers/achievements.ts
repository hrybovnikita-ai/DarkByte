import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser, requireAdmin } from "@/server/auth/context";
import {
  achievementCreateSchema,
  achievementUpdateSchema,
} from "@/server/validators/resources";

function lookup(id: string, publishedOnly: boolean): Prisma.AchievementWhereInput {
  return {
    OR: [{ id }, { code: id }],
    ...(publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

export async function listAchievements(request: Request) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const where: Prisma.AchievementWhereInput = {
    ...(user?.role === "ADMIN" && query.status
      ? { status: query.status }
      : { status: "PUBLISHED" }),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.achievement.count({ where }),
    prisma.achievement.findMany({
      where,
      orderBy: { [query.sort ?? "createdAt"]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return apiSuccess(items, { meta: paginationMeta(query.page, query.pageSize, total) });
}

export async function createAchievement(request: Request) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = achievementCreateSchema.parse(await readJsonBody(request));
  return apiCreated(await requirePrisma().achievement.create({ data: body }));
}

export async function getAchievement(request: Request, id: string) {
  const user = await getAuthUser(request);
  const row = await requirePrisma().achievement.findFirst({
    where: lookup(id, user?.role !== "ADMIN"),
  });
  if (!row) throw new Error("NOT_FOUND");
  return apiSuccess(row);
}

export async function putAchievement(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = achievementCreateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().achievement.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  return apiSuccess(
    await requirePrisma().achievement.update({ where: { id: existing.id }, data: body }),
  );
}

export async function patchAchievement(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = achievementUpdateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().achievement.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  return apiSuccess(
    await requirePrisma().achievement.update({ where: { id: existing.id }, data: body }),
  );
}

export async function deleteAchievement(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const existing = await requirePrisma().achievement.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  await requirePrisma().achievement.delete({ where: { id: existing.id } });
  return apiNoContent();
}