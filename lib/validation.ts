import { z } from "zod";
import { PRICING } from "./pricing";

export const MAX_TEAM_SIZE = 500;
export const MAX_MONTHLY_SPEND = 100000;
export const shareIdSchema = z
  .string()
  .min(12, "invalid share id.")
  .max(40, "invalid share id.")
  .regex(/^[a-z0-9]+$/i, "invalid share id.");

export const toolInputSchema = z
  .object({
    toolKey: z.string().min(1, "is required."),
    usageType: z.enum(["subscription", "api"]),
    planId: z.string().optional(),
    monthlySpend: z
      .number()
      .min(0, "must be a positive number.")
      .max(MAX_MONTHLY_SPEND, `must be less than $${MAX_MONTHLY_SPEND}.`),
    teamSize: z
      .number()
      .int()
      .min(1, "must be at least 1.")
      .max(MAX_TEAM_SIZE, `must be ${MAX_TEAM_SIZE} or fewer.`),
    primaryUseCase: z.enum(["coding", "writing", "research", "data", "mixed"]),
  })
  .superRefine((value, ctx) => {
    const pricing = PRICING[value.toolKey];

    if (!pricing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toolKey"],
        message: "is not supported.",
      });
      return;
    }

    if (!pricing.usageTypes.includes(value.usageType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["usageType"],
        message: "is not available for this tool.",
      });
    }

    if (value.usageType === "subscription") {
      if (!value.planId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["planId"],
          message: "is required for subscriptions.",
        });
      } else if (!pricing.plans[value.planId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["planId"],
          message: "is not valid for this tool.",
        });
      }
    }

    if (value.usageType === "api" && value.planId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["planId"],
        message: "should be empty for API usage.",
      });
    }
  });

export const auditRequestSchema = z.object({
  tools: z.array(toolInputSchema).min(1, "Add at least one tool."),
});

export type AuditRequestInput = z.infer<typeof auditRequestSchema>;

export const auditResultSchema = z.object({
  totalSpend: z.number().min(0),
  totalSavings: z.number().min(0),
  yearlySavings: z.number().min(0),
  recommendations: z.array(
    z.object({
      tool: z.string().min(1),
      currentPlan: z.string().optional(),
      suggestedAction: z.string().min(1),
      estimatedSavings: z.number().min(0),
      reason: z.string().min(1),
      priority: z.enum(["primary", "alternative"]).optional(),
    })
  ),
});

export const summaryRequestSchema = z.object({
  tools: z.array(toolInputSchema).min(1, "Add at least one tool."),
  audit: auditResultSchema,
});

export type SummaryRequestInput = z.infer<typeof summaryRequestSchema>;

export const saveAuditSchema = z.object({
  tools: z.array(toolInputSchema).min(1, "Add at least one tool."),
  audit: auditResultSchema,
  email: z.string().email().optional().nullable(),
});

export type SaveAuditInput = z.infer<typeof saveAuditSchema>;

export const validateAuditRequest = (payload: unknown) =>
  auditRequestSchema.safeParse(payload);
