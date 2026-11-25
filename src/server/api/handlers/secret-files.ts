import type { Prisma } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { apiCreated, apiNoContent, apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser, requireAdmin } from "@/server/auth/context";
import {
  secretFileCreateSchema,
  secretFileUpdateSchema,
} from "@/server/validators/resources";

function lookup(id: string, publishedOnly: boolean): Prisma.SecretFileWhereInput {
  return {
    OR: [{ id }, { fileCode: id }],
    ...(publishedOnly ? { status: "PUBLISHED" } : {}),
  };
}

export async function listSecretFiles(request: Request) {
  const user = await getAuthUser(request);
  const prisma = requirePrisma();
  const query = parseListQuery(new URL(request.url).searchParams);
  const where: Prisma.SecretFileWhereInput = {
    ...(user?.role === "ADMIN" && query.status
      ? { status: query.status }
      : { status: "PUBLISHED" }),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { fileCode: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.secretFile.count({ where }),
    prisma.secretFile.findMany({
      where,
      orderBy: { [query.sort ?? "createdAt"]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return apiSuccess(items, { meta: paginationMeta(query.page, query.pageSize, total) });
}

export async function createSecretFile(request: Request) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = secretFileCreateSchema.parse(await readJsonBody(request));
  return apiCreated(await requirePrisma().secretFile.create({ data: body }));
}

export async function getSecretFile(request: Request, id: string) {
  const user = await getAuthUser(request);
  const row = await requirePrisma().secretFile.findFirst({
    where: lookup(id, user?.role !== "ADMIN"),
  });
  if (!row) throw new Error("NOT_FOUND");
  return apiSuccess(row);
}

export async function putSecretFile(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = secretFileCreateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().secretFile.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  return apiSuccess(
    await requirePrisma().secretFile.update({ where: { id: existing.id }, data: body }),
  );
}

export async function patchSecretFile(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const body = secretFileUpdateSchema.parse(await readJsonBody(request));
  const existing = await requirePrisma().secretFile.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  return apiSuccess(
    await requirePrisma().secretFile.update({ where: { id: existing.id }, data: body }),
  );
}

export async function deleteSecretFile(request: Request, id: string) {
  requireAdmin(await getAuthUser(request, { required: true }));
  const existing = await requirePrisma().secretFile.findFirst({ where: lookup(id, false) });
  if (!existing) throw new Error("NOT_FOUND");
  await requirePrisma().secretFile.delete({ where: { id: existing.id } });
  return apiNoContent();
}