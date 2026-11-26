import { describe, expect, it } from "vitest";
import { verifiedClerkEmail } from "@/server/auth/clerk-sync";

describe("verifiedClerkEmail", () => {
  it("returns null when only unverified addresses exist", () => {
    const user = {
      primaryEmailAddressId: "em_1",
      emailAddresses: [
        { id: "em_1", emailAddress: "a@example.com", verification: { status: "unverified" } },
      ],
    } as Parameters<typeof verifiedClerkEmail>[0];
    expect(verifiedClerkEmail(user)).toBeNull();
  });

  it("uses verified primary email", () => {
    const user = {
      primaryEmailAddressId: "em_1",
      emailAddresses: [
        { id: "em_1", emailAddress: "User@Example.com", verification: { status: "verified" } },
      ],
    } as Parameters<typeof verifiedClerkEmail>[0];
    expect(verifiedClerkEmail(user)).toBe("user@example.com");
  });

  it("falls back to any verified address", () => {
    const user = {
      primaryEmailAddressId: "em_1",
      emailAddresses: [
        { id: "em_1", emailAddress: "old@example.com", verification: { status: "unverified" } },
        { id: "em_2", emailAddress: "new@example.com", verification: { status: "verified" } },
      ],
    } as Parameters<typeof verifiedClerkEmail>[0];
    expect(verifiedClerkEmail(user)).toBe("new@example.com");
  });
});