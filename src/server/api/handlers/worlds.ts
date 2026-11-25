import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser, requireAdmin } from "@/server/auth/context";
import { serializeWorld } from "@/server/mappers/world";
import { worldCreateSchema, worldUpdateSchema } from "@/server/validators/resources";

function worldWhere(
  id: string,
  publishedOnly: boolean,
): Prisma.WorldWhereInput {
  return {
    OR: [{ id }, { slug: id }],
    ...(publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

export async function listWorlds(request: Request) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const isAdmin = user?.role === "ADMIN";

  const where: Prisma.WorldWhereInput = {
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { slug: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(isAdmin && query.status
      ? { status: query.status }
      : { status: "PUBLISHED" }),
  };

  const orderBy: Prisma.WorldOrderByWithRelationInput = {
    [query.sort === "title" ? "title" : "sortOrder"]: query.order,
  };

  const [total, items] = await Promise.all([
    prisma.world.count({ where }),
    prisma.world.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return apiSuccess(
    items.map(serializeWorld),
    { meta: paginationMeta(query.page, query.pageSize, total) },
  );
}

export async function createWorld(request: Request) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const body = worldCreateSchema.parse(await readJsonBody(request));
  const created = await prisma.world.create({ data: body });
  return apiCreated(serializeWorld(created));
}

export async function getWorldById(
  request: Request,
  id: string,
) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const publishedOnly = user?.role !== "ADMIN";
  const row = await prisma.world.findFirst({
    where: worldWhere(id, publishedOnly),
  });
  if (!row) {
    throw new Error("NOT_FOUND");
  }
  return apiSuccess(serializeWorld(row));
}

export async function replaceWorld(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const body = worldCreateSchema.parse(await readJsonBody(request));
  const existing = await prisma.world.findFirst({ where: worldWhere(id, false) });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  const updated = await prisma.world.update({
    where: { id: existing.id },
    data: body,
  });
  return apiSuccess(serializeWorld(updated));
}

export async function patchWorld(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const body = worldUpdateSchema.parse(await readJsonBody(request));
  const existing = await prisma.world.findFirst({ where: worldWhere(id, false) });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  const updated = await prisma.world.update({
    where: { id: existing.id },
    data: body,
  });
  return apiSuccess(serializeWorld(updated));
}

export async function deleteWorld(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const prisma = requirePrisma();
  const existing = await prisma.world.findFirst({ where: worldWhere(id, false) });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  await prisma.world.delete({ where: { id: existing.id } });
  return apiNoContent();
}