import ToolForm from "@/components/ToolForm";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7f9] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_0%_-10%,rgba(15,23,42,0.06),transparent_60%),radial-gradient(900px_500px_at_100%_10%,rgba(15,23,42,0.04),transparent_55%)]" />

      <main className="relative mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
        <section className="animate-fade-up space-y-10">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-600">
            AI Spend Audit Tool
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                Bring clarity to your AI tooling spend in minutes.
              </h1>
              <p className="text-base text-slate-600 sm:text-lg">
                Capture every tool, plan, and usage type in one place. The audit
                engine applies deterministic rules to surface downgrades and
                vendor alternatives with transparent savings.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                At-a-glance
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Average completion time</span>
                  <span className="font-semibold text-slate-900">&lt; 30 sec</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rules-based recommendations</span>
                  <span className="font-semibold text-slate-900">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shareable outputs</span>
                  <span className="font-semibold text-slate-900">Instant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Deterministic
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Clear rules drive every recommendation so finance can trust the
                output.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Fast to finish
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Most teams complete the audit in under 30 seconds.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Share-ready
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Savings breakdowns and downgrade paths ready for budget reviews.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 w-full">
          <ToolForm />
        </div>
      </main>
    </div>
  );
}
