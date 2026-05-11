import type { AuditResult, ToolInput } from "./types";

type SummaryPayload = {
  audit: AuditResult;
  tools: ToolInput[];
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

const buildSummaryContext = (payload: SummaryPayload) => ({
  totalSpend: payload.audit.totalSpend,
  totalSavings: payload.audit.totalSavings,
  yearlySavings: payload.audit.yearlySavings,
  recommendationCount: payload.audit.recommendations.length,
  topRecommendations: payload.audit.recommendations.slice(0, 3).map((rec) => ({
    tool: rec.tool,
    suggestedAction: rec.suggestedAction,
    estimatedSavings: rec.estimatedSavings,
  })),
  tools: payload.tools.map((tool) => ({
    toolKey: tool.toolKey,
    usageType: tool.usageType,
    planId: tool.planId ?? null,
    teamSize: tool.teamSize,
    monthlySpend: tool.monthlySpend,
    primaryUseCase: tool.primaryUseCase,
  })),
});

const buildSystemPrompt = () =>
  "You are a B2B SaaS spend analyst. Write a concise 3-5 sentence summary for a founder. Use only the numbers provided. Do not mention being an AI. Avoid bullet points. If savings are low, say the stack looks optimized. If savings are high, suggest a consultation.";

const buildUserPrompt = (payload: SummaryPayload) => {
  const context = buildSummaryContext(payload);
  return `Audit data (JSON):\n${JSON.stringify(context, null, 2)}`;
};

export const generateSummary = async (payload: SummaryPayload) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "http-referer": process.env.OPENROUTER_REFERRER ?? "",
      "x-title": process.env.OPENROUTER_APP_NAME ?? "AI Spend Audit Tool",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      max_tokens: 200,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(payload),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const snippet = errorText.slice(0, 1000);
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText} ${snippet}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) return null;
  return text.trim();
};
