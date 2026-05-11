import { PRICING } from "./pricing";
import type {
  AuditRecommendation,
  AuditRequest,
  AuditResult,
  ToolInput,
  ToolPricing,
} from "./types";

const TEAM_OVERKILL_MAX_USERS = 2;
const ENTERPRISE_OVERKILL_MAX_USERS = 10;
const API_OVERSPEND_THRESHOLD = 500;
const CREDITS_OPPORTUNITY_THRESHOLD = 1000;
const API_OPTIMIZATION_RATE = 0.1;

const DOWNGRADE_CANDIDATES: Record<string, string[]> = {
  enterprise: ["team", "business", "pro", "plus", "individual", "free"],
  business: ["team", "pro", "plus", "individual", "free"],
  team: ["pro", "plus", "individual", "free"],
  pro: ["plus", "individual", "free"],
  plus: ["free"],
};

const ALTERNATIVE_BY_USE_CASE: Record<string, string[]> = {
  coding: ["cursor", "copilot"],
  writing: ["claude"],
  research: ["gemini", "perplexity"],
  data: ["gemini", "chatgpt"],
  mixed: ["chatgpt", "claude"],
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getPlanLabel = (pricing: ToolPricing, planId: string) =>
  pricing.plans[planId]?.label ?? planId;

const getPlanCost = (
  pricing: ToolPricing,
  planId: string,
  teamSize: number
) => {
  const plan = pricing.plans[planId];
  if (!plan) return 0;
  return plan.perSeat
    ? plan.priceMonthly * Math.max(teamSize, 1)
    : plan.priceMonthly;
};

const findCandidatePlan = (
  pricing: ToolPricing,
  candidates: string[]
): string | undefined =>
  candidates.find((candidate) => Boolean(pricing.plans[candidate]));

const findLowerPricedPlan = (
  pricing: ToolPricing,
  currentPlanId: string
): string | undefined => {
  const entries = Object.entries(pricing.plans).map(([id, plan]) => ({
    id,
    priceMonthly: plan.priceMonthly,
  }));
  const current = pricing.plans[currentPlanId];
  if (!current) return undefined;

  const sorted = entries.sort((a, b) => a.priceMonthly - b.priceMonthly);
  const currentIndex = sorted.findIndex((entry) => entry.id === currentPlanId);
  if (currentIndex <= 0) return undefined;
  return sorted[currentIndex - 1]?.id;
};

const getCurrentPlanLabel = (tool: ToolInput, pricing?: ToolPricing) => {
  if (tool.usageType === "api") return "API";
  if (!pricing || !tool.planId) return undefined;
  return getPlanLabel(pricing, tool.planId);
};

const buildRecommendationKey = (recommendation: AuditRecommendation) =>
  `${recommendation.tool}:${recommendation.suggestedAction}`;

const pickCheapestPlan = (pricing: ToolPricing) => {
  const entries = Object.entries(pricing.plans);
  if (entries.length === 0) return undefined;
  return entries.reduce((lowest, entry) =>
    entry[1].priceMonthly < lowest[1].priceMonthly ? entry : lowest
  )[0];
};

const addRecommendation = (
  recommendation: AuditRecommendation,
  recommendations: AuditRecommendation[],
  seen: Set<string>
) => {
  const key = buildRecommendationKey(recommendation);
  if (seen.has(key)) return;
  seen.add(key);
  recommendations.push(recommendation);
};

const addPlanDowngrade = (
  tool: ToolInput,
  pricing: ToolPricing,
  planId: string,
  reason: string,
  recommendations: AuditRecommendation[],
  seen: Set<string>
) => {
  const targetCost = getPlanCost(pricing, planId, tool.teamSize);
  const savings = roundCurrency(Math.max(0, tool.monthlySpend - targetCost));

  if (savings <= 0) return;

  addRecommendation(
    {
      tool: pricing.toolName,
      currentPlan: getCurrentPlanLabel(tool, pricing),
      suggestedAction: `Downgrade to ${getPlanLabel(pricing, planId)}`,
      estimatedSavings: savings,
      reason,
    },
    recommendations,
    seen
  );
};

const selectPrimaryRecommendation = (
  recommendations: AuditRecommendation[]
) => {
  if (recommendations.length === 0) return null;
  return recommendations.reduce((best, current) =>
    current.estimatedSavings > best.estimatedSavings ? current : best
  );
};

const rankRecommendations = (
  recommendations: AuditRecommendation[],
  primary: AuditRecommendation | null
): AuditRecommendation[] =>
  recommendations.map((recommendation) => {
    const priority: AuditRecommendation["priority"] =
      recommendation === primary ? "primary" : "alternative";
    return {
      ...recommendation,
      priority,
    };
  });

export const runAudit = (request: AuditRequest): AuditResult => {
  const recommendations: AuditRecommendation[] = [];
  const totalSpend = roundCurrency(
    request.tools.reduce((sum, tool) => sum + tool.monthlySpend, 0)
  );
  let totalSavings = 0;

  request.tools.forEach((tool) => {
    const pricing = PRICING[tool.toolKey];

    if (!pricing) return;

    const toolRecommendations: AuditRecommendation[] = [];
    const toolSeen = new Set<string>();

    if (tool.usageType === "subscription" && tool.planId) {
      const plan = pricing.plans[tool.planId];

      if (plan) {
        const planLabel = plan.label.toLowerCase();
        const planId = tool.planId.toLowerCase();
        const isTeamLike =
          planLabel.includes("team") || planLabel.includes("business") || planId.includes("team");
        const isEnterprise = planLabel.includes("enterprise") || planId.includes("enterprise");

        if (isTeamLike && tool.teamSize <= TEAM_OVERKILL_MAX_USERS) {
          const candidate = findCandidatePlan(
            pricing,
            DOWNGRADE_CANDIDATES.team
          );
          if (candidate) {
            addPlanDowngrade(
              tool,
              pricing,
              candidate,
              "Team plan with a small team.",
              toolRecommendations,
              toolSeen
            );
          }
        }

        if (isEnterprise && tool.teamSize <= ENTERPRISE_OVERKILL_MAX_USERS) {
          const candidate = findCandidatePlan(
            pricing,
            DOWNGRADE_CANDIDATES.enterprise
          );
          if (candidate) {
            addPlanDowngrade(
              tool,
              pricing,
              candidate,
              "Enterprise tier looks oversized for the current team size.",
              toolRecommendations,
              toolSeen
            );
          }
        }

        const downgradeCandidates = DOWNGRADE_CANDIDATES[planId];
        const targetPlan = downgradeCandidates
          ? findCandidatePlan(pricing, downgradeCandidates)
          : findLowerPricedPlan(pricing, tool.planId);

        if (targetPlan) {
          addPlanDowngrade(
            tool,
            pricing,
            targetPlan,
            "Lower tier plan appears to cover the current usage.",
            toolRecommendations,
            toolSeen
          );
        }
      }
    }

    const alternatives = ALTERNATIVE_BY_USE_CASE[tool.primaryUseCase] ?? [];
    const alternativeKey = alternatives.find(
      (candidate) => candidate !== tool.toolKey && PRICING[candidate]
    );

    if (alternativeKey) {
      const alternativePricing = PRICING[alternativeKey];
      const cheapestPlanId = pickCheapestPlan(alternativePricing);
      if (cheapestPlanId) {
        const altCost = getPlanCost(
          alternativePricing,
          cheapestPlanId,
          tool.teamSize
        );
        const savings = roundCurrency(Math.max(0, tool.monthlySpend - altCost));

        if (savings > 0) {
          addRecommendation(
            {
              tool: pricing.toolName,
              currentPlan: getCurrentPlanLabel(tool, pricing),
              suggestedAction: `Consider ${alternativePricing.toolName} ${getPlanLabel(
                alternativePricing,
                cheapestPlanId
              )}`,
              estimatedSavings: savings,
              reason: `Primary use case suggests ${alternativePricing.toolName} may be a better fit.`,
            },
            toolRecommendations,
            toolSeen
          );
        }
      }
    }

    if (tool.usageType === "api" && tool.monthlySpend >= API_OVERSPEND_THRESHOLD) {
      const savings = roundCurrency(tool.monthlySpend * API_OPTIMIZATION_RATE);

      addRecommendation(
        {
          tool: pricing.toolName,
          currentPlan: "API",
          suggestedAction: "Review API provider pricing",
          estimatedSavings: savings,
          reason: "High API spend suggests an opportunity to optimize rates or routing.",
        },
        toolRecommendations,
        toolSeen
      );

      addRecommendation(
        {
          tool: pricing.toolName,
          currentPlan: "API",
          suggestedAction: "Request API credits or committed-use discounts",
          estimatedSavings: 0,
          reason: "API vendors often provide credits or discounts for sustained usage.",
        },
        toolRecommendations,
        toolSeen
      );
    }

    if (tool.monthlySpend >= CREDITS_OPPORTUNITY_THRESHOLD) {
      addRecommendation(
        {
          tool: pricing.toolName,
          currentPlan: getCurrentPlanLabel(tool, pricing),
          suggestedAction: "Explore startup or committed-use credits",
          estimatedSavings: 0,
          reason: "Vendors often provide credits for high or growing spend.",
        },
        toolRecommendations,
        toolSeen
      );
    }

    const primaryRecommendation = selectPrimaryRecommendation(
      toolRecommendations
    );
    if (primaryRecommendation) {
      totalSavings += primaryRecommendation.estimatedSavings;
    }

    const ranked = rankRecommendations(
      toolRecommendations,
      primaryRecommendation
    );
    recommendations.push(...ranked);
  });

  const boundedSavings = Math.min(totalSavings, totalSpend);
  const roundedSavings = roundCurrency(Math.max(0, boundedSavings));

  return {
    totalSpend,
    totalSavings: roundedSavings,
    yearlySavings: roundCurrency(roundedSavings * 12),
    recommendations,
  };
};
