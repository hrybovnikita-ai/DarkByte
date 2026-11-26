import { describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { verifyPassword } from "@/server/auth/password";
import { GET as healthGet } from "@/app/api/health/route";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Auth + Neon integration", () => {
  it("GET /api/health reports database connected", async () => {
    const response = await healthGet(new Request("http://localhost/api/health"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.database.connected).toBe(true);
    expect(body.data.auth.nextAuthOperational).toBe(true);
  });

  it("POST /api/auth/register creates a user row", async () => {
    const email = `vitest-${Date.now()}@darkbyte.local`;
    const password = "VitestPass99";
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Vitest", email, password }),
    });

    const response = await registerPost(request, {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(email);

    const prisma = new PrismaClient();
    try {
      const row = await prisma.user.findUnique({ where: { email } });
      expect(row).not.toBeNull();
      expect(row?.passwordHash).toBeTruthy();
      expect(row?.emailVerified).toBeTruthy();
      expect(await verifyPassword(password, row!.passwordHash!)).toBe(true);
    } finally {
      const row = await prisma.user.findUnique({ where: { email } });
      if (row) {
        await prisma.creditTransaction.deleteMany({ where: { userId: row.id } });
        await prisma.creditAccount.deleteMany({ where: { userId: row.id } });
        await prisma.user.delete({ where: { id: row.id } });
      }
      await prisma.$disconnect();
    }
  });
});