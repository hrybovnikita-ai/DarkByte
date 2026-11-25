import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser } from "@/server/auth/context";
import {
  pixelProjectCreateSchema,
  pixelProjectUpdateSchema,
} from "@/server/validators/resources";

function assertOwner(userId: string, ownerId: string, isAdmin: boolean) {
  if (!isAdmin && userId !== ownerId) {
    throw new Error("FORBIDDEN");
  }
}

export async function listPixelProjects(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const isAdmin = user.role === "ADMIN";

  const where: Prisma.PixelProjectWhereInput = {
    ...(isAdmin ? {} : { userId: user.id }),
    ...(isAdmin && query.status ? { status: query.status } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: "insensitive" } }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.pixelProject.count({ where }),
    prisma.pixelProject.findMany({
      where,
      orderBy: { [query.sort ?? "updatedAt"]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return apiSuccess(items, { meta: paginationMeta(query.page, query.pageSize, total) });
}

export async function createPixelProject(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const body = pixelProjectCreateSchema.parse(await readJsonBody(request));
  const created = await requirePrisma().pixelProject.create({
    data: {
      ...body,
      userId: user.id,
      dataJson: (body.dataJson ?? {}) as Prisma.InputJsonValue,
    },
  });
  return apiCreated(created);
}

export async function getPixelProject(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const row = await requirePrisma().pixelProject.findUnique({ where: { id } });
  if (!row) throw new Error("NOT_FOUND");
  assertOwner(user.id, row.userId, user.role === "ADMIN");
  return apiSuccess(row);
}

export async function putPixelProject(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const body = pixelProjectCreateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().pixelProject.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  assertOwner(user.id, existing.userId, user.role === "ADMIN");
  const updated = await requirePrisma().pixelProject.update({
    where: { id },
    data: {
      ...body,
      dataJson: (body.dataJson ?? {}) as Prisma.InputJsonValue,
    },
  });
  return apiSuccess(updated);
}

export async function patchPixelProject(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const body = pixelProjectUpdateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().pixelProject.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  assertOwner(user.id, existing.userId, user.role === "ADMIN");
  const updateData: Prisma.PixelProjectUpdateInput = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.dataJson !== undefined
      ? { dataJson: body.dataJson as Prisma.InputJsonValue }
      : {}),
  };
  const updated = await requirePrisma().pixelProject.update({
    where: { id },
    data: updateData,
  });
  return apiSuccess(updated);
}

export async function deletePixelProject(request: Request, id: string) {
  const user = await getAuthUser(request, { required: true });
  const existing = await requirePrisma().pixelProject.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  assertOwner(user.id, existing.userId, user.role === "ADMIN");
  await requirePrisma().pixelProject.delete({ where: { id } });
  return apiNoContent();
}