import { z } from "zod";
import { requirePrisma } from "@/lib/db";
import { getAuthUser } from "@/server/auth/context";
import { apiNoContent, apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { applyForgetPlan } from "@/server/memory/forget";

export async function listMemory(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const prisma = requirePrisma();
  const [entries, preferences, profile] = await Promise.all([
    prisma.memoryEntry.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        kind: true,
        content: true,
        importance: true,
        createdAt: true,
        updatedAt: true,
        sourceConversationId: true,
      },
    }),
    prisma.userPreference.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, key: true, value: true, confidence: true, updatedAt: true },
    }),
    prisma.userMemoryProfile.findUnique({
      where: { userId: user.id },
      select: { narrative: true, updatedAt: true },
    }),
  ]);
  const response = apiSuccess({ entries, preferences, profile });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

const deleteSchema = z
  .object({
    ids: z.array(z.string().min(1)).optional(),
    all: z.boolean().optional(),
    query: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export async function deleteMemory(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const body = deleteSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();

  if (body.all) {
    await applyForgetPlan(prisma, user.id, { forgetAll: true, phrases: [] });
    return apiNoContent();
  }

  if (body.query) {
    await applyForgetPlan(prisma, user.id, { forgetAll: false, phrases: [body.query] });
    return apiNoContent();
  }

  const ids = body.ids ?? [];
  if (!ids.length) return apiNoContent();

  await prisma.memoryEntry.deleteMany({
    where: { userId: user.id, id: { in: ids } },
  });
  return apiNoContent();
}