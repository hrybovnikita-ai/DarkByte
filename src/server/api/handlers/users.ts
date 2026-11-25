import { requirePrisma } from "@/lib/db";
import { apiSuccess } from "@/server/api/response";
import { readJsonBody } from "@/server/middleware/request";
import { getAuthUser } from "@/server/auth/context";
import { userPatchSchema } from "@/server/validators/resources";

export async function getCurrentUser(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const prisma = requirePrisma();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return apiSuccess(record);
}

export async function patchCurrentUser(request: Request) {
  const user = await getAuthUser(request, { required: true });
  const body = userPatchSchema.parse(await readJsonBody(request));
  const prisma = requirePrisma();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: body,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return apiSuccess(updated);
}