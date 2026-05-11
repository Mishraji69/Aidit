import { describe, expect, it } from "vitest";
import { auditRequestSchema, shareIdSchema } from "@/lib/validation";

const baseTool = {
  toolKey: "chatgpt",
  usageType: "subscription" as const,
  planId: "plus",
  monthlySpend: 20,
  teamSize: 1,
  primaryUseCase: "coding" as const,
};

describe("validation schemas", () => {
  it("rejects subscription entries without a plan", () => {
    const result = auditRequestSchema.safeParse({
      tools: [{ ...baseTool, planId: undefined }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid plan ids for a tool", () => {
    const result = auditRequestSchema.safeParse({
      tools: [{ ...baseTool, planId: "enterprise-plus" }],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid share ids and rejects invalid ones", () => {
    expect(shareIdSchema.safeParse("abc123def456").success).toBe(true);
    expect(shareIdSchema.safeParse("bad-id!").success).toBe(false);
  });
});
