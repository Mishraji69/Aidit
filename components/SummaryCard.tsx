type SummaryCardProps = {
  summary?: string;
  fallback?: string;
};

export default function SummaryCard({
  summary,
  fallback = "Run the audit to generate a concise, personalized summary.",
}: SummaryCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Summary
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {summary ?? fallback}
      </p>
    </div>
  );
}
