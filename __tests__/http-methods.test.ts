import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as companiesGet } from "@/app/api/companies/route";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as monstersGet } from "@/app/api/monsters/route";

const prismaMock = {
  monster: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  getPrisma: () => prismaMock,
  requirePrisma: () => prismaMock,
  isDatabaseConfigured: () => true,
}));

describe("HTTP route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    prismaMock.monster.count.mockResolvedValue(0);
    prismaMock.monster.findMany.mockResolvedValue([]);
  });

  it("GET /api/health returns 200", async () => {
    const response = await healthGet(new Request("http://localhost/api/health"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });

  it("GET /api/companies returns 12 innovators", async () => {
    const request = new Request("http://localhost/api/companies?pageSize=20");
    const response = await companiesGet(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(12);
    expect(body.data[0]).toMatchObject({
      name: expect.any(String),
      slug: expect.any(String),
      integrationStatus: "INSPIRATION_ONLY",
    });
  });

  it("GET /api/monsters returns paginated list", async () => {
    const request = new Request("http://localhost/api/monsters?page=1");
    const response = await monstersGet(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});