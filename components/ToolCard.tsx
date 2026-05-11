import type { PrimaryUseCase, ToolPricing, UsageType } from "@/lib/types";

const INPUT_CLASSES =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 placeholder:text-slate-400";

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

type ToolCardProps = {
  index: number;
  tool: {
    id: string;
    toolKey: string;
    usageType: UsageType;
    planId?: string;
    monthlySpend: number;
    teamSize: number;
    primaryUseCase: PrimaryUseCase;
    priceOverridden?: boolean;
  };
  pricing: ToolPricing;
  toolOptions: Option[];
  primaryUseCases: Option[];
  usageTypeLabels: Record<UsageType, string>;
  onFieldChange: (field: ToolField, value: string | number) => void;
  onRemove: () => void;
  disableRemove: boolean;
};

export default function ToolCard({
  index,
  tool,
  pricing,
  toolOptions,
  primaryUseCases,
  usageTypeLabels,
  onFieldChange,
  onRemove,
  disableRemove,
}: ToolCardProps) {
  const planOptions = Object.entries(pricing.plans).map(([planId, plan]) => ({
    value: planId,
    label: `${plan.label} ($${plan.priceMonthly}${plan.perSeat ? " per seat" : ""})`,
  }));

  const selectedPlan = tool.planId ? pricing.plans[tool.planId] : undefined;
  const pricingHint = selectedPlan
    ? selectedPlan.perSeat
      ? `Per-seat plan at $${selectedPlan.priceMonthly}`
      : `Flat plan at $${selectedPlan.priceMonthly}`
    : "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tool {index + 1}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {pricing.toolName}
          </h3>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disableRemove}
          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Tool name
          <select
            className={INPUT_CLASSES}
            value={tool.toolKey}
            onChange={(event) => onFieldChange("toolKey", event.target.value)}
          >
            {toolOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Usage type
          <select
            className={INPUT_CLASSES}
            value={tool.usageType}
            onChange={(event) => onFieldChange("usageType", event.target.value)}
            disabled={pricing.usageTypes.length === 1}
          >
            {pricing.usageTypes.map((usageType) => (
              <option key={usageType} value={usageType}>
                {usageTypeLabels[usageType]}
              </option>
            ))}
          </select>
        </label>

        {tool.usageType === "subscription" ? (
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plan
            <select
              className={INPUT_CLASSES}
              value={tool.planId ?? ""}
              onChange={(event) => onFieldChange("planId", event.target.value)}
            >
              {planOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {pricingHint ? (
              <span className="mt-1 block text-[11px] font-medium text-slate-500">
                {pricingHint}
              </span>
            ) : null}
          </label>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500 sm:col-span-2">
            API usage selected. Enter your monthly spend estimate below.
          </div>
        )}

        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Team size
          <input
            className={INPUT_CLASSES}
            type="number"
            min={1}
            step={1}
            value={tool.teamSize}
            onChange={(event) =>
              onFieldChange("teamSize", Number(event.target.value))
            }
          />
        </label>

        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Primary use case
          <select
            className={INPUT_CLASSES}
            value={tool.primaryUseCase}
            onChange={(event) =>
              onFieldChange("primaryUseCase", event.target.value)
            }
          >
            {primaryUseCases.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:col-span-2">
          Monthly spend (USD)
          <input
            className={INPUT_CLASSES}
            type="number"
            min={0}
            step={0.01}
            value={tool.monthlySpend}
            onChange={(event) =>
              onFieldChange("monthlySpend", Number(event.target.value))
            }
          />
          <span className="mt-1 block text-[11px] font-medium text-slate-500">
            {tool.priceOverridden
              ? "Custom estimate saved."
              : "Auto-filled from pricing. Edit if needed."}
          </span>
        </label>
      </div>
    </div>
  );
}
