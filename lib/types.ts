export type UsageType = "subscription" | "api";

export type PrimaryUseCase =
  | "coding"
  | "writing"
  | "research"
  | "data"
  | "mixed";

export type ToolCategory =
  | "assistant"
  | "coding"
  | "writing"
  | "research"
  | "data"
  | "platform"
  | "other";

export type PlanInfo = {
  label: string;
  priceMonthly: number;
  perSeat: boolean;
};

export type ToolPricing = {
  toolName: string;
  category: ToolCategory;
  usageTypes: UsageType[];
  plans: Record<string, PlanInfo>;
  api?: {
    pricePerMillionTokens: number;
  };
};

export type PricingTable = Record<string, ToolPricing>;

export type ToolInput = {
  toolKey: string;
  usageType: UsageType;
  planId?: string;
  monthlySpend: number;
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
};

export type AuditRecommendation = {
  tool: string;
  currentPlan?: string;
  suggestedAction: string;
  estimatedSavings: number;
  reason: string;
  priority?: "primary" | "alternative";
};

export type AuditResult = {
  totalSpend: number;
  totalSavings: number;
  yearlySavings: number;
  recommendations: AuditRecommendation[];
};

export type AuditRequest = {
  tools: ToolInput[];
};
