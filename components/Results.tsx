import type { AuditResult } from "@/lib/types";
import SummaryCard from "./SummaryCard";

type ResultsProps = {
  result: AuditResult;
  summary?: string;
  summaryFallback?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function Results({
  result,
  summary,
  summaryFallback,
}: ResultsProps) {
  const hasSavings = result.totalSavings > 0;
  const needsConsult = result.totalSavings >= 500;
  const optimizedStack = result.totalSavings < 50;
  const fallbackMessage =
    summaryFallback ??
    (hasSavings
      ? "A personalized summary will appear here once AI summaries are enabled."
      : "Run the audit after adjusting inputs to generate a summary.");
  const recommendationGroups = result.recommendations.reduce<
    {
      tool: string;
      primary: AuditResult["recommendations"][number] | null;
      alternatives: AuditResult["recommendations"][number][];
    }[]
  >((groups, recommendation) => {
    const existing = groups.find((group) => group.tool === recommendation.tool);
    if (existing) {
      existing.alternatives.push(recommendation);
      return groups;
    }

    groups.push({
      tool: recommendation.tool,
      primary: null,
      alternatives: [recommendation],
    });
    return groups;
  }, []);

  const orderedGroups = recommendationGroups.map((group) => {
    const explicitPrimary = group.alternatives.find(
      (rec) => rec.priority === "primary"
    );
    const primary =
      explicitPrimary ??
      group.alternatives.reduce((best, current) =>
        current.estimatedSavings > best.estimatedSavings ? current : best
      );
    const alternatives = group.alternatives.filter((rec) => rec !== primary);
    return { ...group, primary, alternatives };
  });

  return (
    <section
      id="results"
      className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] animate-fade-up"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
            Results
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            Audit results & savings outlook
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Deterministic recommendations based on the inputs you provided.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Rules-based
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Monthly savings
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            {formatCurrency(result.totalSavings)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Yearly savings
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            {formatCurrency(result.yearlySavings)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Current spend
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            {formatCurrency(result.totalSpend)}
          </p>
        </div>
      </div>

      {needsConsult ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            High impact opportunity
          </p>
          <p className="mt-2">
            Savings exceed {formatCurrency(500)} / month. A consultation can
            help capture the full upside.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Request consult
          </button>
        </div>
      ) : null}

      {optimizedStack ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
          Your stack already looks optimized. Keep monitoring monthly usage for
          small wins.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-lg font-semibold text-slate-900">
              Recommendations
            </h4>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {orderedGroups.length} tools
            </span>
          </div>

          {orderedGroups.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              No immediate savings found. Review quarterly as usage changes.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {orderedGroups.map((group) => (
                <div
                  key={group.tool}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {group.tool}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Primary recommendation
                      </p>
                    </div>
                    {group.primary.estimatedSavings > 0 ? (
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                        Save {formatCurrency(group.primary.estimatedSavings)} / mo
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        No direct savings
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    {group.primary.suggestedAction}
                  </p>
                  {group.primary.currentPlan ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Current: {group.primary.currentPlan}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {group.primary.reason}
                  </p>

                  {group.alternatives.length > 0 ? (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Alternatives (not counted in totals)
                      </p>
                      <div className="mt-3 space-y-3">
                        {group.alternatives.map((alternative) => (
                          <div key={alternative.suggestedAction}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-700">
                                {alternative.suggestedAction}
                              </p>
                              {alternative.estimatedSavings > 0 ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                  Potential {formatCurrency(alternative.estimatedSavings)} / mo
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                                  Informational
                                </span>
                              )}
                            </div>
                            {alternative.currentPlan ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Current: {alternative.currentPlan}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-slate-500">
                              {alternative.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <SummaryCard summary={summary} fallback={fallbackMessage} />
      </div>
    </section>
  );
}
