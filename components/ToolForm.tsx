"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { runAudit } from "@/lib/audit";
import { PRICING } from "@/lib/pricing";
import {
  auditRequestSchema,
  saveAuditSchema,
  type AuditRequestInput,
} from "@/lib/validation";
import type {
  AuditResult,
  PrimaryUseCase,
  ToolInput,
  UsageType,
} from "@/lib/types";
import Results from "./Results";
import ToolCard from "./ToolCard";

type ToolFormItem = ToolInput & { id: string; priceOverridden?: boolean };

type ToolField =
  | "toolKey"
  | "usageType"
  | "planId"
  | "teamSize"
  | "monthlySpend"
  | "primaryUseCase";

type Option = {
  value: string;
  label: string;
};

const STORAGE_KEY = "ai-spend-audit:tools";
const FALLBACK_TOOL_KEY = "chatgpt";

const PRIMARY_USE_CASE_OPTIONS: Option[] = [
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "research", label: "Research" },
  { value: "data", label: "Data" },
  { value: "mixed", label: "Mixed" },
];

const USAGE_TYPE_LABELS: Record<UsageType, string> = {
  subscription: "Subscription",
  api: "API",
};

const FIELD_LABELS: Record<string, string> = {
  toolKey: "Tool",
  usageType: "Usage type",
  planId: "Plan",
  teamSize: "Team size",
  monthlySpend: "Monthly spend",
  primaryUseCase: "Primary use case",
};
const FORM_INPUT_CLASSES =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 placeholder:text-slate-400";

const getSafeToolKey = (toolKey?: string) =>
  toolKey && PRICING[toolKey] ? toolKey : FALLBACK_TOOL_KEY;

const getDefaultPlanId = (toolKey: string, usageType: UsageType) => {
  if (usageType !== "subscription") return undefined;
  const planKeys = Object.keys(PRICING[toolKey].plans);
  return planKeys[0];
};

const computeMonthlySpend = (
  toolKey: string,
  usageType: UsageType,
  planId: string | undefined,
  teamSize: number
) => {
  if (usageType !== "subscription" || !planId) return 0;
  const plan = PRICING[toolKey].plans[planId];
  if (!plan) return 0;
  return plan.perSeat ? plan.priceMonthly * Math.max(teamSize, 1) : plan.priceMonthly;
};

const buildDefaultTool = (id: string): ToolFormItem => {
  const toolKey = getSafeToolKey(FALLBACK_TOOL_KEY);
  const pricing = PRICING[toolKey];
  const usageType = pricing.usageTypes[0] ?? "subscription";
  const planId = getDefaultPlanId(toolKey, usageType);
  const teamSize = 1;
  return {
    id,
    toolKey,
    usageType,
    planId,
    teamSize,
    monthlySpend: computeMonthlySpend(toolKey, usageType, planId, teamSize),
    primaryUseCase: "coding",
    priceOverridden: false,
  };
};

const hydrateTool = (value: unknown, index: number): ToolFormItem => {
  const fallback = buildDefaultTool(`tool-${index + 1}`);
  if (!value || typeof value !== "object") return fallback;

  const record = value as Partial<ToolFormItem>;
  const toolKey = getSafeToolKey(record.toolKey);
  const pricing = PRICING[toolKey];
  const usageType =
    record.usageType && pricing.usageTypes.includes(record.usageType)
      ? record.usageType
      : pricing.usageTypes[0] ?? "subscription";
  const planId =
    usageType === "subscription"
      ? record.planId && pricing.plans[record.planId]
        ? record.planId
        : getDefaultPlanId(toolKey, usageType)
      : undefined;
  const teamSize =
    typeof record.teamSize === "number" && record.teamSize > 0
      ? Math.round(record.teamSize)
      : fallback.teamSize;
  const monthlySpend =
    typeof record.monthlySpend === "number" && record.monthlySpend >= 0
      ? record.monthlySpend
      : computeMonthlySpend(toolKey, usageType, planId, teamSize);
  const primaryUseCase = PRIMARY_USE_CASE_OPTIONS.some(
    (option) => option.value === record.primaryUseCase
  )
    ? (record.primaryUseCase as PrimaryUseCase)
    : fallback.primaryUseCase;

  return {
    id: typeof record.id === "string" && record.id ? record.id : fallback.id,
    toolKey,
    usageType,
    planId,
    teamSize,
    monthlySpend,
    primaryUseCase,
    priceOverridden: Boolean(record.priceOverridden),
  };
};

const createId = () =>
  `tool-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export default function ToolForm() {
  const [tools, setTools] = useState<ToolFormItem[]>(() => {
    if (typeof window === "undefined") {
      return [buildDefaultTool("tool-1")];
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [buildDefaultTool("tool-1")];

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, index) => hydrateTool(item, index));
      }
    } catch {
      return [buildDefaultTool("tool-1")];
    }

    return [buildDefaultTool("tool-1")];
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditInput, setAuditInput] = useState<AuditRequestInput | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const summaryRequestId = useRef(0);
  const [email, setEmail] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toolOptions = useMemo<Option[]>(
    () =>
      Object.entries(PRICING).map(([key, value]) => ({
        value: key,
        label: value.toolName,
      })),
    []
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  }, [tools]);

  const clearSummary = () => {
    summaryRequestId.current += 1;
    setSummaryText(null);
    setSummaryStatus("idle");
  };

  const clearShareState = () => {
    setSaveStatus("idle");
    setShareUrl(null);
    setSaveError(null);
  };

  const requestSummary = async (
    auditInput: AuditRequestInput,
    audit: AuditResult
  ) => {
    const requestId = summaryRequestId.current + 1;
    summaryRequestId.current = requestId;
    setSummaryStatus("loading");
    setSummaryText(null);

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tools: auditInput.tools,
          audit,
        }),
      });

      const data = (await response.json()) as { summary?: string };

      if (summaryRequestId.current !== requestId) return;

      if (!response.ok || !data.summary || !data.summary.trim()) {
        setSummaryStatus("error");
        return;
      }

      setSummaryText(data.summary.trim());
      setSummaryStatus("idle");
    } catch {
      if (summaryRequestId.current !== requestId) return;
      setSummaryStatus("error");
    }
  };

  const handleFieldChange = (
    id: string,
    field: ToolField,
    value: string | number
  ) => {
    setFormErrors((current) => (current.length ? [] : current));
    setAuditResult(null);
    setAuditInput(null);
    clearSummary();
    clearShareState();
    setTools((current) =>
      current.map((tool) => {
        if (tool.id !== id) return tool;

        if (field === "toolKey") {
          const toolKey = getSafeToolKey(String(value));
          const pricing = PRICING[toolKey];
          const usageType = pricing.usageTypes[0] ?? "subscription";
          const planId = getDefaultPlanId(toolKey, usageType);
          const monthlySpend = computeMonthlySpend(
            toolKey,
            usageType,
            planId,
            tool.teamSize
          );
          return {
            ...tool,
            toolKey,
            usageType,
            planId,
            monthlySpend,
            priceOverridden: false,
          };
        }

        if (field === "usageType") {
          const usageType = String(value) as UsageType;
          const pricing = PRICING[tool.toolKey];
          const nextUsageType = pricing.usageTypes.includes(usageType)
            ? usageType
            : pricing.usageTypes[0] ?? "subscription";
          const planId = getDefaultPlanId(tool.toolKey, nextUsageType);
          const monthlySpend =
            nextUsageType === "subscription"
              ? computeMonthlySpend(
                  tool.toolKey,
                  nextUsageType,
                  planId,
                  tool.teamSize
                )
              : tool.priceOverridden
                ? tool.monthlySpend
                : 0;
          return {
            ...tool,
            usageType: nextUsageType,
            planId,
            monthlySpend,
            priceOverridden:
              nextUsageType === "subscription" ? false : tool.priceOverridden,
          };
        }

        if (field === "planId") {
          const planId = String(value);
          const monthlySpend = computeMonthlySpend(
            tool.toolKey,
            tool.usageType,
            planId,
            tool.teamSize
          );
          return {
            ...tool,
            planId,
            monthlySpend,
            priceOverridden: false,
          };
        }

        if (field === "teamSize") {
          const teamSizeValue = Number(value);
          const teamSize = Number.isFinite(teamSizeValue)
            ? Math.max(1, Math.round(teamSizeValue))
            : tool.teamSize;
          const monthlySpend =
            tool.usageType === "subscription" && !tool.priceOverridden
              ? computeMonthlySpend(
                  tool.toolKey,
                  tool.usageType,
                  tool.planId,
                  teamSize
                )
              : tool.monthlySpend;
          return { ...tool, teamSize, monthlySpend };
        }

        if (field === "monthlySpend") {
          const spendValue = Number(value);
          const monthlySpend = Number.isFinite(spendValue)
            ? Math.max(0, spendValue)
            : tool.monthlySpend;
          return { ...tool, monthlySpend, priceOverridden: true };
        }

        if (field === "primaryUseCase") {
          return {
            ...tool,
            primaryUseCase: String(value) as PrimaryUseCase,
          };
        }

        return tool;
      })
    );
  };

  const handleAddTool = () => {
    setAuditResult(null);
    setAuditInput(null);
    clearSummary();
    clearShareState();
    setTools((current) => [...current, buildDefaultTool(createId())]);
  };

  const handleRemoveTool = (id: string) => {
    setAuditResult(null);
    setAuditInput(null);
    clearSummary();
    clearShareState();
    setTools((current) =>
      current.length > 1 ? current.filter((tool) => tool.id !== id) : current
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      tools: tools.map((tool) => ({
        toolKey: tool.toolKey,
        usageType: tool.usageType,
        planId: tool.planId,
        monthlySpend: tool.monthlySpend,
        teamSize: tool.teamSize,
        primaryUseCase: tool.primaryUseCase,
      })),
    };

    const result = auditRequestSchema.safeParse(payload);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => {
        if (issue.path[0] === "tools" && typeof issue.path[1] === "number") {
          const toolIndex = issue.path[1] + 1;
          const fieldKey =
            typeof issue.path[2] === "string" ? issue.path[2] : "";
          const fieldLabel = fieldKey
            ? FIELD_LABELS[fieldKey] ?? fieldKey
            : "Entry";
          return `Tool ${toolIndex}: ${fieldLabel} ${issue.message}`;
        }
        return issue.message;
      });

      setFormErrors(messages);
      setAuditResult(null);
      setAuditInput(null);
      clearSummary();
      clearShareState();
      return;
    }

    setFormErrors([]);
    const nextAudit = runAudit(result.data);
    setAuditResult(nextAudit);
    setAuditInput(result.data);
    clearSummary();
    clearShareState();
    void requestSummary(result.data, nextAudit);
  };

  const handleSave = async () => {
    if (!auditResult || !auditInput) return;

    const emailValue = email.trim();
    const payload = {
      tools: auditInput.tools,
      audit: auditResult,
      email: emailValue ? emailValue : null,
    };

    const parsed = saveAuditSchema.safeParse(payload);

    if (!parsed.success) {
      setSaveStatus("error");
      setSaveError("Enter a valid email address to continue.");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json()) as { shareId?: string };

      if (!response.ok || !data.shareId) {
        setSaveStatus("error");
        setSaveError("Unable to save the audit right now.");
        return;
      }

      const sharePath = `/result/${data.shareId}`;
      const fullUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${sharePath}`
          : sharePath;
      setShareUrl(fullUrl);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setSaveError("Unable to save the audit right now.");
    }
  };

  const summaryFallback = auditResult
    ? summaryStatus === "loading"
      ? "Generating your AI summary now."
      : summaryStatus === "error"
        ? "Summary unavailable right now. Deterministic recommendations still apply."
        : auditResult.totalSavings > 0
          ? "A personalized summary will appear here once generated."
          : "Run the audit after adjusting inputs to generate a summary."
    : undefined;

  const hasErrors = formErrors.length > 0;

  const saveLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : "Save & generate link";

  return (
    <div className="flex w-full flex-col gap-8">
      <form
        className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        onSubmit={handleSubmit}
        aria-describedby={hasErrors ? "form-errors" : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Audit inputs</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add each AI tool, pick the plan, and adjust spend. Changes save
              automatically in this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTool}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10"
          >
            Add tool
          </button>
        </div>

        {hasErrors ? (
          <div
            id="form-errors"
            role="alert"
            aria-live="polite"
            className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-600">
              Fix these before running the audit
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-5">
          {tools.map((tool, index) => {
            const pricing = PRICING[tool.toolKey];
            return (
              <ToolCard
                key={tool.id}
                index={index}
                tool={tool}
                pricing={pricing}
                toolOptions={toolOptions}
                primaryUseCases={PRIMARY_USE_CASE_OPTIONS}
                usageTypeLabels={USAGE_TYPE_LABELS}
                onFieldChange={(field, value) =>
                  handleFieldChange(tool.id, field, value)
                }
                onRemove={() => handleRemoveTool(tool.id)}
                disableRemove={tools.length === 1}
              />
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            No email required to see your audit results.
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Run audit
          </button>
        </div>
      </form>

      {auditResult ? (
        <Results
          result={auditResult}
          summary={summaryText ?? undefined}
          summaryFallback={summaryFallback}
        />
      ) : null}

      {auditResult ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Save & share
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Add an optional email to receive the report. We will generate a
                shareable link after saving.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="rounded-full bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveLabel}
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Email (optional)
              <input
                className={FORM_INPUT_CLASSES}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearShareState();
                }}
              />
            </label>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Shareable link
              </p>
              {shareUrl ? (
                <a
                  className="mt-2 block text-sm font-semibold text-slate-900 underline decoration-slate-300"
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shareUrl}
                </a>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  Save to generate a public results link.
                </p>
              )}
            </div>
          </div>

          {saveError ? (
            <p className="mt-3 text-sm text-rose-600">{saveError}</p>
          ) : null}
          {saveStatus === "saved" && !saveError ? (
            <p className="mt-3 text-sm text-emerald-600">
              Saved. Share the link above with your team.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
