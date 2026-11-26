import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-callback";

describe("safeCallbackUrl", () => {
  it("allows known app paths", () => {
    expect(safeCallbackUrl("/chat")).toBe("/chat");
    expect(safeCallbackUrl("/account#credits")).toBe("/account#credits");
  });

  it("rejects external and protocol-relative urls", () => {
    expect(safeCallbackUrl("https://evil.example")).toBeNull();
    expect(safeCallbackUrl("//evil.example")).toBeNull();
    expect(safeCallbackUrl("/worlds")).toBeNull();
  });
});