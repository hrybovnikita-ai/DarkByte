import type { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { requirePrisma } from "@/lib/db";
import { isAuthSecretConfigured } from "@/server/auth/config";

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

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const userId = token?.id ?? token?.sub;
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