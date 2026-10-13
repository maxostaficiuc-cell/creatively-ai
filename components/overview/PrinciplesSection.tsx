import Link from "next/link";
import type { Principle } from "@/lib/overviewInsights";

// Compact, secondary: up to three principles, chosen from the user's own
// recurring issues (each links to the report it came from). With no findings,
// three general principles are shown and labelled as general.

export function PrinciplesSection({ principles }: { principles: { items: Principle[]; personalised: boolean } }) {
  return (
    <section aria-labelledby="principles-title" className="ov-reveal" style={{ animationDelay: "100ms" }}>
      <h2 id="principles-title" className="font-medium text-ink-primary">
        What makes an ad stronger
      </h2>
      <p className="mt-1 text-sm text-ink-secondary">
        {principles.personalised ? "The principles behind your most common issues." : "General principles — these become specific to you after a few analyses."}
      </p>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {principles.items.map((p, i) => (
          <li key={p.key} className="rounded-2xl border border-base-border bg-base-card p-4">
            <p className="text-[11px] tabular-nums text-ink-muted">0{i + 1}</p>
            <h3 className="mt-1 text-sm font-medium text-ink-primary">{p.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{p.text}</p>
            {p.sourceId && (
              <Link href={`/my-creatives/${p.sourceId}`} className="mt-2 inline-block text-xs text-brand-light hover:underline">
                Seen in your report
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
