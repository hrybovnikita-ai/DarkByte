import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser, requireAdmin } from "@/server/auth/context";
import { storyCreateSchema, storyUpdateSchema } from "@/server/validators/resources";

function lookup(id: string, publishedOnly: boolean): Prisma.StoryWhereInput {
  return {
    OR: [{ id }, { slug: id }],
    ...(publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

export async function listStories(request: Request) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const where: Prisma.StoryWhereInput = {
    ...(user?.role === "ADMIN" && query.status
      ? { status: query.status }
      : { status: "PUBLISHED" }),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { slug: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.story.count({ where }),
    prisma.story.findMany({
      where,
      orderBy: { [query.sort ?? "createdAt"]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return apiSuccess(items, { meta: paginationMeta(query.page, query.pageSize, total) });
}

export async function createStory(request: Request) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = storyCreateSchema.parse(await readJsonBody(request));
  const created = await requirePrisma().story.create({ data: body });
  return apiCreated(created);
}

export async function getStory(request: Request, id: string) {
  const user = await getAuthUser(request);
  const row = await requirePrisma().story.findFirst({
    where: lookup(id, user?.role !== "ADMIN"),
  });
  if (!row) throw new Error("NOT_FOUND");
  return apiSuccess(row);
}

export async function putStory(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = storyCreateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().story.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  const updated = await requirePrisma().story.update({
    where: { id: existing.id },
    data: body,
  });
  return apiSuccess(updated);
}

export async function patchStory(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = storyUpdateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().story.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  const updated = await requirePrisma().story.update({
    where: { id: existing.id },
    data: body,
  });
  return apiSuccess(updated);
}

export async function deleteStory(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const existing = await requirePrisma().story.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  await requirePrisma().story.delete({ where: { id: existing.id } });
  return apiNoContent();
}