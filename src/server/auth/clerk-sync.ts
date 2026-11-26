import type { User as ClerkUser } from "@clerk/backend";
import type { Role } from "@prisma/client";
import { requirePrisma } from "@/lib/db";
import { grantWelcomeCredits } from "@/server/credits/ledger";

function isVerifiedClerkEmail(
  entry: ClerkUser["emailAddresses"][number],
): boolean {
  const status = entry.verification?.status;
  return status === "verified";
}

/** Never link Neon users using an unverified Clerk email. */
export function verifiedClerkEmail(user: ClerkUser): string | null {
  const primary = user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId);
  if (primary && isVerifiedClerkEmail(primary)) {
    return primary.emailAddress.toLowerCase();
  }
  const anyVerified = user.emailAddresses.find((entry) => isVerifiedClerkEmail(entry));
  return anyVerified ? anyVerified.emailAddress.toLowerCase() : null;
}

export async function linkOrCreateUserFromClerk(clerkUser: ClerkUser) {
  const prisma = requirePrisma();
  const email = verifiedClerkEmail(clerkUser);
  if (!email) {
    throw new Error("CLERK_EMAIL_NOT_VERIFIED");
  }

  const bootstrapAdmin = process.env.DARKBYTE_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const clerkId = clerkUser.id;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;
  const image = clerkUser.imageUrl ?? null;

  const existingByClerk = await prisma.user.findUnique({ where: { clerkId } });
  if (existingByClerk) {
    const updated = await prisma.user.update({
      where: { id: existingByClerk.id },
      data: {
        email,
        name: name ?? existingByClerk.name,
        image: image ?? existingByClerk.image,
        emailVerified: existingByClerk.emailVerified ?? new Date(),
      },
    });
    await syncClerkPublicMetadata(clerkId, updated.id, updated.role);
    return updated;
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    if (existingByEmail.clerkId && existingByEmail.clerkId !== clerkId) {
      throw new Error("DUPLICATE_CLERK_IDENTITY");
    }
    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkId,
        name: name ?? existingByEmail.name,
        image: image ?? existingByEmail.image,
        emailVerified: existingByEmail.emailVerified ?? new Date(),
        ...(bootstrapAdmin && email === bootstrapAdmin ? { role: "ADMIN" as Role } : {}),
      },
    });
    await syncClerkPublicMetadata(clerkId, updated.id, updated.role);
    return updated;
  }

  const created = await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
      image,
      emailVerified: new Date(),
      ...(bootstrapAdmin && email === bootstrapAdmin ? { role: "ADMIN" as Role } : {}),
    },
  });

  await grantWelcomeCredits(created.id).catch(() => undefined);
  await syncClerkPublicMetadata(created.clerkId!, created.id, created.role);
  return created;
}

async function syncClerkPublicMetadata(clerkId: string, darkbyteUserId: string, role: Role) {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkId, {
    publicMetadata: { darkbyteUserId, role },
  });
}

export async function ensureClerkMetadata(clerkId: string, darkbyteUserId: string, role: Role) {
  await syncClerkPublicMetadata(clerkId, darkbyteUserId, role);
}

export async function resolveDbUserFromClerkId(clerkId: string) {
  const prisma = requirePrisma();
  const byClerk = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, name: true, role: true, image: true, clerkId: true },
  });
  if (byClerk) return byClerk;

  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const linked = await linkOrCreateUserFromClerk(clerkUser);
  return {
    id: linked.id,
    email: linked.email,
    name: linked.name,
    role: linked.role,
    image: linked.image,
    clerkId: linked.clerkId,
  };
}