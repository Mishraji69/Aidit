import Link from "next/link";
import { notFound } from "next/navigation";
import Results from "@/components/Results";
import { getAuditByShareId } from "@/lib/audits";
import { PRICING } from "@/lib/pricing";
import { shareIdSchema } from "@/lib/validation";
import type { ToolInput } from "@/lib/types";

export const dynamic = "force-dynamic";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const getToolLabel = (tool: ToolInput) =>
  PRICING[tool.toolKey]?.toolName ?? tool.toolKey;

const getPlanLabel = (tool: ToolInput) => {
  if (tool.usageType === "api") return "API";
  const pricing = PRICING[tool.toolKey];
  if (tool.planId && pricing?.plans[tool.planId]) {
    return pricing.plans[tool.planId].label;
  }
  return tool.planId ?? "Subscription";
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = shareIdSchema.safeParse(id);

  if (!parsed.success) {
    notFound();
  }

  const { data, error } = await getAuditByShareId(parsed.data);

  if (!data) {
    if (error === "supabase_not_configured") {
      return (
        <div className="min-h-screen bg-[#f6f7f9] px-6 py-16 text-slate-900">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Results unavailable
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              Supabase is not configured for this deployment.
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Configure your Supabase environment variables to enable shared
              audit pages.
            </p>
            <Link
              className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
              href="/"
            >
              Run a new audit
            </Link>
          </div>
        </div>
      );
    }

    notFound();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7f9] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_0%_-10%,rgba(15,23,42,0.06),transparent_60%),radial-gradient(900px_500px_at_100%_10%,rgba(15,23,42,0.04),transparent_55%)]" />

      <main className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Shared audit
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
              AI spend audit results
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Public view with savings insights. Email is never displayed.
            </p>
          </div>
          <Link
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm"
            href="/"
          >
            Run your own audit
          </Link>
        </header>

        <Results
          result={data.audit}
          summaryFallback="Summary is only available in the private audit view."
        />

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Inputs
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Tool breakdown
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {data.tools.length} tools
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {data.tools.map((tool) => (
              <div
                key={`${tool.toolKey}-${tool.usageType}-${tool.planId ?? "api"}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {getToolLabel(tool)}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {tool.primaryUseCase}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-slate-500">Usage</p>
                    <p className="mt-1">{tool.usageType}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Plan</p>
                    <p className="mt-1">{getPlanLabel(tool)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Team size</p>
                    <p className="mt-1">{tool.teamSize}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Monthly spend</p>
                    <p className="mt-1">{formatCurrency(tool.monthlySpend)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
