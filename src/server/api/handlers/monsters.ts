import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser, requireAdmin } from "@/server/auth/context";
import {
  monsterCreateSchema,
  monsterUpdateSchema,
} from "@/server/validators/resources";

function lookup(id: string, publishedOnly: boolean): Prisma.MonsterWhereInput {
  return {
    OR: [{ id }, { externalId: id }],
    ...(publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

export async function listMonsters(request: Request) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const where: Prisma.MonsterWhereInput = {
    ...(user?.role === "ADMIN" && query.status
      ? { status: query.status }
      : { status: "PUBLISHED" }),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { externalId: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy = {
    [query.sort ?? "createdAt"]: query.order,
  } as Prisma.MonsterOrderByWithRelationInput;

  const [total, items] = await Promise.all([
    prisma.monster.count({ where }),
    prisma.monster.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return apiSuccess(items, {
    meta: paginationMeta(query.page, query.pageSize, total),
  });
}

export async function createMonster(request: Request) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const body = monsterCreateSchema.parse(await readJsonBody(request));
  const created = await prisma.monster.create({ data: body });
  return apiCreated(created);
}

export async function getMonster(request: Request, id: string) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const row = await prisma.monster.findFirst({
    where: lookup(id, user?.role !== "ADMIN"),
  });
  if (!row) {
    throw new Error("NOT_FOUND");
  }
  return apiSuccess(row);
}

export async function putMonster(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const body = monsterCreateSchema.parse(await readJsonBody(request));
  const existing = await prisma.monster.findFirst({ where: lookup(id, false) });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  const updated = await prisma.monster.update({
    where: { id: existing.id },
    data: body,
  });
  return apiSuccess(updated);
}

export async function patchMonster(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const body = monsterUpdateSchema.parse(await readJsonBody(request));
  const existing = await prisma.monster.findFirst({ where: lookup(id, false) });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  const updated = await prisma.monster.update({
    where: { id: existing.id },
    data: body,
  });
  return apiSuccess(updated);
}

export async function deleteMonster(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const existing = await prisma.monster.findFirst({ where: lookup(id, false) });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  await prisma.monster.delete({ where: { id: existing.id } });
  return apiNoContent();
}