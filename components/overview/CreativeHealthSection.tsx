"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { CreativeHealthData } from "@/lib/creativeHealth";
import type { HealthPeriod, HealthStats } from "@/lib/overviewInsights";

// Creative Health: real averages of the user's saved analyses. The trend only
// appears when both the last 30 days and the 30 before have ≥2 analyses.

const SIGNALS: { key: keyof Omit<CreativeHealthData["signals"], "fatigueRisk">; label: string }[] = [
  { key: "hookStrength", label: "Hook" },
  { key: "messageClarity", label: "Clarity" },
  { key: "visualAttention", label: "Visual hierarchy" },
  { key: "ctaStrength", label: "CTA" },
  { key: "audienceMatch", label: "Audience match" },
];

export function CreativeHealthSection({
  health,
  signals,
}: {
  health: Record<HealthPeriod, HealthStats>;
  signals: Record<HealthPeriod, CreativeHealthData | null>;
}) {
  const [period, setPeriod] = useState<HealthPeriod>(health["30D"].count > 0 || health.ALL.count === 0 ? "30D" : "ALL");
  const h = health[period];
  const sig = signals[period];
  const empty = health.ALL.count === 0;

  return (
    <section aria-labelledby="health-title" className="ov-reveal h-full rounded-2xl border border-base-border bg-base-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="health-title" className="font-medium text-ink-primary">
            Creative Health
          </h2>
          <p className="mt-0.5 text-sm text-ink-secondary">{period === "30D" ? "Your analyses from the last 30 days." : "All your analyses."}</p>
        </div>
        {!empty && (
          <div role="group" aria-label="Period" className="flex rounded-full border border-base-border bg-base-surface p-0.5">
            {(["30D", "ALL"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${period === p ? "bg-base-card text-ink-primary" : "text-ink-muted hover:text-ink-secondary"}`}
              >
                {p === "30D" ? "30 days" : "All time"}
              </button>
            ))}
          </div>
        )}
      </div>

      {empty ? (
        <div className="mt-6 rounded-xl border border-dashed border-base-border bg-base-surface/40 p-6 text-center">
          <p className="text-sm text-ink-primary">No analyses yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">Your average score, recurring issues and trend appear after your first analysis.</p>
          <Link href="/analyze" className="mt-3 inline-block text-sm text-brand-light hover:underline">
            Analyze a creative
          </Link>
        </div>
      ) : h.count === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-base-border bg-base-surface/40 p-6 text-center">
          <p className="text-sm text-ink-primary">No analyses in the last 30 days</p>
          <button type="button" onClick={() => setPeriod("ALL")} className="mt-2 text-sm text-brand-light hover:underline">
            Show all time
          </button>
        </div>
      ) : (
        <div key={period} className="ov-swap">
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-base-border bg-base-border sm:grid-cols-4">
            <Tile label="Average score" value={h.average !== null ? String(h.average) : "—"} sub="out of 100" />
            <Tile label="Analyzed" value={String(h.count)} sub={h.count === 1 ? "creative" : "creatives"} />
            <Tile
              label="Need attention"
              value={String(h.needsWork)}
              sub={h.needsWork ? "under 60 or high-priority fix" : "none flagged"}
              href={h.needsWork ? "/my-creatives" : undefined}
            />
            <Tile
              label="Trend"
              value={h.trend === null ? "—" : `${h.trend > 0 ? "+" : ""}${h.trend}`}
              sub={h.trend === null ? (period === "30D" ? "needs 2+ analyses in each 30-day window" : "switch to 30 days") : "pts vs previous 30 days"}
              tone={h.trend === null ? undefined : h.trend > 0 ? "up" : h.trend < 0 ? "down" : "flat"}
            />
          </div>

          {sig && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Average signal scores</p>
              <ul className="mt-3 space-y-2.5">
                {SIGNALS.map((s, i) => {
                  const v = sig.signals[s.key];
                  const weak = v <= 50;
                  return (
                    <li key={s.key} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-xs sm:grid-cols-[130px_1fr_32px]">
                      <span className="text-ink-secondary">{s.label}</span>
                      <span className="relative h-1.5 overflow-hidden rounded-full bg-base-surface">
                        <span
                          className={`ov-bar absolute inset-y-0 left-0 rounded-full ${weak ? "bg-brand/50" : "bg-gradient-to-r from-brand to-brand-light"}`}
                          style={{ width: `${Math.max(2, Math.min(100, v))}%`, animationDelay: `${120 + i * 70}ms` }}
                        />
                      </span>
                      <span className={`text-right tabular-nums ${weak ? "text-ink-muted" : "text-ink-primary"}`}>{v}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] text-ink-muted">0–100, averaged from the signal scores in your reports.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Tile({ label, value, sub, tone, href }: { label: string; value: string; sub: string; tone?: "up" | "down" | "flat"; href?: string }) {
  const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : tone === "flat" ? Minus : null;
  const body = (
    <>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className={`text-2xl font-semibold tabular-nums tracking-tight ${tone === "up" ? "text-accent-green" : tone === "down" ? "text-accent-red" : "text-ink-primary"}`}
        >
          {value}
        </span>
        {Icon && <Icon size={14} className={tone === "up" ? "text-accent-green" : tone === "down" ? "text-accent-red" : "text-ink-muted"} />}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{sub}</p>
    </>
  );
  return href ? (
    <Link href={href} className="block bg-base-card p-4 transition-colors hover:bg-base-surface">
      {body}
    </Link>
  ) : (
    <div className="bg-base-card p-4">{body}</div>
  );
}
