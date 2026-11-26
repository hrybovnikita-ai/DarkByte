import type { Role } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { isAuthSecretConfigured } from "@/server/auth/config";
import { readAuthSession, readAuthTokenFromRequest } from "@/server/auth/session";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
};

export async function getAuthUser(
  request: Request,
  options: { required: true },
): Promise<AuthUser>;
export async function getAuthUser(
  request: Request,
  options?: { required?: boolean },
): Promise<AuthUser | null>;
export async function getAuthUser(
  request: Request,
  options?: { required?: boolean },
): Promise<AuthUser | null> {
  if (!isAuthSecretConfigured()) {
    if (options?.required) {
      throw new Error("UNAUTHORIZED");
    }
    return null;
  }

  const session = await readAuthSession();
  let userId = session?.user?.id ?? null;
  if (!userId) {
    const token = await readAuthTokenFromRequest(request);
    userId = token?.id ? String(token.id) : token?.sub ? String(token.sub) : null;
  }
  if (!userId) {
    if (options?.required) {
      throw new Error("UNAUTHORIZED");
    }
    return null;
  }

  const prisma = requirePrisma();
  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
    },
  });

  if (!user) {
    if (options?.required) {
      throw new Error("UNAUTHORIZED");
    }
    return null;
  }

  return user;
}

export function requireAdmin(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}