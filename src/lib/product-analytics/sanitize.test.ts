import { describe, expect, it } from "vitest";
import {
  sanitizeProductAnalyticsMetadata,
  sanitizeSessionId,
} from "./sanitize";

describe("sanitizeProductAnalyticsMetadata", () => {
  it("drops prompt-like keys and long strings", () => {
    const out = sanitizeProductAnalyticsMetadata({
      latencyMs: 1200,
      userPrompt: "secret",
      email: "a@b.com",
      title: "Hades",
    });
    expect(out.latencyMs).toBe(1200);
    expect(out.title).toBe("Hades");
    expect(out).not.toHaveProperty("userPrompt");
    expect(out).not.toHaveProperty("email");
  });
});

describe("sanitizeSessionId", () => {
  it("accepts uuid-like ids", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(sanitizeSessionId(id)).toBe(id);
  });

  it("rejects invalid characters", () => {
    expect(sanitizeSessionId("bad id!")).toBeNull();
  });
});
