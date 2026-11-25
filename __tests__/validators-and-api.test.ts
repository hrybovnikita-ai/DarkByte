import { describe, expect, it } from "vitest";
import {
  favoriteCreateSchema,
  monsterCreateSchema,
  worldCreateSchema,
} from "@/server/validators/resources";
import { listQuerySchema } from "@/server/api/pagination";
import { handleRouteError } from "@/server/api/response";

describe("Zod validators", () => {
  it("accepts valid world payload", () => {
    const data = worldCreateSchema.parse({
      slug: "ocean",
      code: "W01",
      title: "Ocean Abyss",
      category: "UNDERWATER",
      headline: "Deep",
      description: "Short",
      longDescription: "Long",
      buttonLabel: "Explore",
      routePath: "/worlds/ocean",
      sceneId: "ocean",
      themePrimary: "#00BFFF",
      themeSecondary: "#2563FF",
      themeAccent: "#E0F7FF",
      themeGlow: "rgba(0,0,0,0.2)",
      atmosphereClass: "atmosphere-ocean",
    });
    expect(data.slug).toBe("ocean");
  });

  it("rejects invalid monster payload", () => {
    expect(() => monsterCreateSchema.parse({ name: "" })).toThrow();
  });

  it("parses favorite target types", () => {
    const fav = favoriteCreateSchema.parse({
      targetType: "MONSTER",
      targetId: "cuid123",
    });
    expect(fav.targetType).toBe("MONSTER");
  });
});

describe("pagination query", () => {
  it("applies defaults", () => {
    const q = listQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(20);
  });
});

describe("API error mapping", () => {
  it("maps NOT_FOUND", async () => {
    const response = handleRouteError(new Error("NOT_FOUND"));
    expect(response.status).toBe(404);
  });

  it("maps UNAUTHORIZED", async () => {
    const response = handleRouteError(new Error("UNAUTHORIZED"));
    expect(response.status).toBe(401);
  });

  it("maps FORBIDDEN", async () => {
    const response = handleRouteError(new Error("FORBIDDEN"));
    expect(response.status).toBe(403);
  });
});