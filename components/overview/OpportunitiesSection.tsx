import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { Opportunity } from "@/lib/overviewInsights";

// "Your Biggest Opportunities": recurring weaknesses found in the user's own
// recent reports, most widespread first. The recommended action and finding are
// quoted from the worst-affected report, which is linked as the source.

export function OpportunitiesSection({ opportunities, analysesCount }: { opportunities: Opportunity[]; analysesCount: number }) {
  const shown = opportunities.slice(0, 4);

  return (
    <section aria-labelledby="opp-title" className="ov-reveal" style={{ animationDelay: "60ms" }}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="opp-title" className="font-medium text-ink-primary">
            Your Biggest Opportunities
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">Recurring issues from your recent reports, most common first.</p>
        </div>
      </div>

      {analysesCount === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-6 text-sm text-ink-secondary">
          Opportunities come from your own reports. Analyze a creative and the issues it finds will be ranked here.
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-base-border bg-base-card p-6 text-sm text-ink-secondary">
          None of your recent reports score a core signal at 5/10 or below — no recurring weakness to fix right now.
        </div>
      ) : (
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {shown.map((o, i) => (
            <li
              key={o.key}
              className="ov-reveal opp-card group relative flex flex-col rounded-2xl border border-base-border bg-base-card p-5 transition-[border-color,box-shadow] duration-200"
              style={{ animationDelay: `${100 + i * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-light">
                    <Target size={14} />
                  </span>
                  <h3 className="font-medium text-ink-primary">{o.issue}</h3>
                </div>
                <span className="shrink-0 rounded-full border border-base-border px-2 py-0.5 text-[11px] tabular-nums text-ink-secondary">
                  {o.flagged} of {o.outOf}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                {o.finding && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">What the report found</dt>
                    <dd className="mt-0.5 leading-relaxed text-ink-secondary">{o.finding}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Why it matters</dt>
                  <dd className="mt-0.5 leading-relaxed text-ink-secondary">{o.why}</dd>
                </div>
                {o.action && (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-light">Recommended action</dt>
                    <dd className="mt-0.5 leading-relaxed text-ink-primary">{o.action}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Expected impact</dt>
                  <dd className="mt-0.5 leading-relaxed text-ink-secondary">{o.impact} A hypothesis to test, not a guaranteed result.</dd>
                </div>
              </dl>

              <div className="mt-auto pt-4">
                <Link
                  href={`/my-creatives/${o.source.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-base-border bg-base-surface px-3 py-2.5 text-xs transition-colors hover:border-brand/40"
                >
                  <span className="min-w-0">
                    <span className="text-ink-muted">Source: </span>
                    <span className="truncate text-ink-secondary">
                      “{o.source.summary.length > 70 ? `${o.source.summary.slice(0, 70)}…` : o.source.summary}”
                    </span>
                    <span className="text-ink-muted">
                      {" "}
                      · {o.source.signal}/10{o.others > 0 ? ` · +${o.others} more` : ""}
                    </span>
                  </span>
                  <ArrowRight size={13} className="shrink-0 text-brand-light transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
