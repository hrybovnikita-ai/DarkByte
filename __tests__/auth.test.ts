import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/server/validators/auth";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("Auth validators", () => {
  it("accepts valid registration", () => {
    const data = registerSchema.parse({
      name: "Nikita",
      email: "user@example.com",
      password: "SecurePass1",
    });
    expect(data.email).toBe("user@example.com");
  });

  it("rejects weak passwords", () => {
    expect(() =>
      registerSchema.parse({
        name: "User",
        email: "a@b.co",
        password: "short",
      }),
    ).toThrow();
  });

  it("parses forgot and reset payloads", () => {
    forgotPasswordSchema.parse({ email: "user@example.com" });
    resetPasswordSchema.parse({
      email: "user@example.com",
      token: "a".repeat(32),
      password: "NewPass12",
    });
  });
});

describe("Password hashing", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("DarkByte99");
    expect(await verifyPassword("DarkByte99", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});