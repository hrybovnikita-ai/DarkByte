import { describe, expect, it } from "vitest";
import { aiErrorFromHttpStatus } from "@/server/ai/providers";

describe("aiErrorFromHttpStatus", () => {
  it("maps provider 402 to UNAVAILABLE 503 (not user credits)", () => {
    const err = aiErrorFromHttpStatus(402, "SambaNova · Gemma 4 31B", '{"code":"PAYMENT_METHOD_REQUIRED"}');
    expect(err.code).toBe("UNAVAILABLE");
    expect(err.status).toBe(503);
    expect(err.message).toMatch(/not charged/i);
  });

  it("maps Gemini-style 503 to UNAVAILABLE without charging", () => {
    const err = aiErrorFromHttpStatus(503, "Google · Gemini 3.8 Flash", "UNAVAILABLE");
    expect(err.code).toBe("UNAVAILABLE");
    expect(err.status).toBe(503);
    expect(err.message).toMatch(/not charged/i);
  });
});