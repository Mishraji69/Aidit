import { describe, expect, it } from "vitest";
import { runAudit } from "@/lib/audit";
import type { AuditRequest } from "@/lib/types";

describe("runAudit", () => {
  it("calculates savings and yearly totals", () => {
    const request: AuditRequest = {
      tools: [
        {
          toolKey: "chatgpt",
          usageType: "subscription",
          planId: "team",
          monthlySpend: 60,
          teamSize: 2,
          primaryUseCase: "coding",
        },
      ],
    };

    const result = runAudit(request);

    expect(result.totalSpend).toBe(60);
    expect(result.totalSavings).toBe(60);
    expect(result.yearlySavings).toBe(720);

    const actions = result.recommendations.map((rec) => rec.suggestedAction);
    expect(actions).toContain("Downgrade to Plus");
    expect(actions).toContain("Consider Cursor Pro");

    const primaryRecommendations = result.recommendations.filter(
      (rec) => rec.priority === "primary"
    );
    expect(primaryRecommendations).toHaveLength(1);
    expect(primaryRecommendations[0]?.estimatedSavings).toBe(result.totalSavings);
  });

  it("flags enterprise plans for small teams", () => {
    const request: AuditRequest = {
      tools: [
        {
          toolKey: "chatgpt",
          usageType: "subscription",
          planId: "enterprise",
          monthlySpend: 300,
          teamSize: 5,
          primaryUseCase: "mixed",
        },
      ],
    };

    const result = runAudit(request);
    const downgrade = result.recommendations.find((rec) =>
      rec.suggestedAction.includes("Downgrade to Team")
    );

    expect(downgrade).toBeDefined();
    expect(downgrade?.estimatedSavings).toBe(150);
  });

  it("adds API overspend recommendations", () => {
    const request: AuditRequest = {
      tools: [
        {
          toolKey: "openai_api",
          usageType: "api",
          monthlySpend: 600,
          teamSize: 1,
          primaryUseCase: "research",
        },
      ],
    };

    const result = runAudit(request);
    const actions = result.recommendations.map((rec) => rec.suggestedAction);

    expect(actions).toContain("Review API provider pricing");
    expect(actions).toContain("Request API credits or committed-use discounts");

    const apiRec = result.recommendations.find(
      (rec) => rec.suggestedAction === "Review API provider pricing"
    );
    expect(apiRec?.estimatedSavings).toBe(60);
  });

  it("does not double count multiple recommendations for a tool", () => {
    const request: AuditRequest = {
      tools: [
        {
          toolKey: "chatgpt",
          usageType: "subscription",
          planId: "team",
          monthlySpend: 80,
          teamSize: 2,
          primaryUseCase: "coding",
        },
      ],
    };

    const result = runAudit(request);

    expect(result.totalSpend).toBe(80);
    expect(result.totalSavings).toBe(60);
    expect(result.totalSavings).toBeLessThanOrEqual(result.totalSpend);

    const primaryRecommendations = result.recommendations.filter(
      (rec) => rec.priority === "primary"
    );
    expect(primaryRecommendations).toHaveLength(1);
  });

  it("never allows total savings to exceed total spend", () => {
    const request: AuditRequest = {
      tools: [
        {
          toolKey: "chatgpt",
          usageType: "subscription",
          planId: "enterprise",
          monthlySpend: 120,
          teamSize: 4,
          primaryUseCase: "mixed",
        },
        {
          toolKey: "openai_api",
          usageType: "api",
          monthlySpend: 500,
          teamSize: 1,
          primaryUseCase: "research",
        },
      ],
    };

    const result = runAudit(request);
    expect(result.totalSavings).toBeLessThanOrEqual(result.totalSpend);
  });
});
