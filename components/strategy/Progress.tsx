"use client";

import { Check, Loader2, X } from "lucide-react";

export type StepState = "pending" | "active" | "done" | "failed";

// Real progress only: each row reflects a server request that is actually
// running, finished, or failed. No percentages, no timers.
const ROWS: { label: string; step: number }[] = [
  { label: "Understanding your brand", step: 0 },
  { label: "Analyzing your products and positioning", step: 0 },
  { label: "Identifying your target audience", step: 1 },
  { label: "Developing advertising concepts", step: 2 },
];

export function Progress({ steps, brand }: { steps: StepState[]; brand: string | null | undefined }) {
  return (
    <div className="rounded-2xl border border-base-border bg-base-card p-6" aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-light">Working on it</p>
      <h2 className="mt-2 truncate text-lg font-semibold text-ink-primary">{brand || "Your brand"}</h2>
      <ol className="mt-5 space-y-3">
        {ROWS.map((r) => {
          const st = steps[r.step];
          return (
            <li key={r.label} className={`flex items-center gap-3 text-sm transition-colors ${st === "pending" ? "text-ink-muted" : "text-ink-primary"}`}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  st === "done" ? "border-brand bg-brand text-white" : st === "active" ? "border-brand/60 text-brand-light" : st === "failed" ? "border-accent-red/60 text-accent-red" : "border-base-border"
                }`}
              >
                {st === "done" ? <Check size={13} /> : st === "active" ? <Loader2 size={13} className="animate-spin" /> : st === "failed" ? <X size={13} /> : null}
              </span>
              {r.label}
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-xs text-ink-muted">This usually takes under a minute. Nothing is charged for the analysis.</p>
    </div>
  );
}
