"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  Users,
  Megaphone,
  FlaskConical,
  Layers,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info,
} from "lucide-react";
import { ScoreRing } from "@/components/marketing/ScoreRing";
import { ButtonLink } from "@/components/ui/Button";
import type { CreativeReport } from "@/lib/analyzeCreative";

const VERDICT_TONE: Record<CreativeReport["final_recommendation"]["verdict"], string> = {
  YES: "border-accent-green/40 text-accent-green bg-accent-green/10",
  "YES — WITH CHANGES": "border-brand/40 text-brand-light bg-brand/10",
  "TEST FIRST": "border-orange-400/40 text-orange-400 bg-orange-400/10",
  "NO — REWORK REQUIRED": "border-accent-red/40 text-accent-red bg-accent-red/10",
};

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-base-border bg-base-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink-primary">
          <span className="text-brand-light">{icon}</span>
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export function CreativeReportView({
  report,
  imageUrl,
  isSimulated,
  showUpgradeCta = false,
}: {
  report: CreativeReport;
  imageUrl?: string | null;
  isSimulated?: boolean;
  showUpgradeCta?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Creative scan + score */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-base-border bg-base-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Creative Scan</p>
              <span className="flex items-center gap-1.5 rounded-full bg-accent-green/10 px-2.5 py-1 text-[11px] text-accent-green">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green" /> Analyzed
              </span>
            </div>
            {imageUrl ? (
              <div className="overflow-hidden rounded-xl bg-black">
                <img src={imageUrl} alt="" className="max-h-96 w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-black text-sm text-ink-secondary">
                No preview available
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-brand/40 bg-base-card p-6 shadow-glow lg:col-span-1">
          <ScoreRing score={report.score} label={report.verdict_label} />
        </div>

        <div className="rounded-2xl border border-base-border bg-base-card p-6 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Overall Verdict</p>
          <p className="mt-2 text-sm text-ink-primary">{report.summary}</p>
          <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${VERDICT_TONE[report.final_recommendation.verdict]}`}>
            {report.final_recommendation.verdict}
          </div>
          <p className="mt-2 text-xs text-ink-secondary">{report.final_recommendation.reason}</p>
          {isSimulated && (
            <p className="mt-3 text-xs text-ink-muted">
              Simulated result — connect a real AI provider for genuine analysis.
            </p>
          )}
        </div>
      </div>

      {/* Executive summary */}
      <div className="rounded-2xl border border-base-border bg-base-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Executive Summary</p>
        <p className="mt-2 text-sm text-ink-secondary">{report.executive_summary}</p>
        <div className="mt-5 grid gap-4 border-t border-base-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-accent-green">Biggest Strength</p>
            <p className="mt-1 text-xs text-ink-secondary">{report.biggest_strength}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-accent-red">Biggest Weakness</p>
            <p className="mt-1 text-xs text-ink-secondary">{report.biggest_weakness}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-brand-light">Biggest Opportunity</p>
            <p className="mt-1 text-xs text-ink-secondary">{report.biggest_opportunity}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-primary">Campaign Readiness</p>
            <p className="mt-1 text-xs text-ink-secondary">{report.campaign_readiness}</p>
          </div>
        </div>
      </div>

      {/* What's great / priority fixes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-base-border bg-base-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent-green">
            <TrendingUp size={14} /> What&apos;s Great
          </p>
          <ul className="mt-3 space-y-2">
            {report.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-ink-secondary">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent-green" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-base-border bg-base-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent-red">
            <TrendingDown size={14} /> Priority Fixes
          </p>
          <ul className="mt-3 space-y-2">
            {report.priority_fixes.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-ink-secondary">
                <XCircle size={14} className="mt-0.5 shrink-0 text-accent-red" /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expected impact */}
      <div className="flex gap-3 rounded-2xl border border-base-border bg-base-card p-5">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-light" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-light">Expected Impact</p>
          <p className="mt-1.5 text-sm text-ink-secondary">{report.expected_impact}</p>
        </div>
      </div>

      {/* Signal breakdown */}
      <Section title="Signal Breakdown" icon={<Layers size={16} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          {report.signal_scores.map((s) => (
            <div key={s.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{s.label}</span>
                <span className="text-ink-primary">{s.score.toFixed(1)} / 10</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                  style={{ width: `${(s.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why this score */}
      <Section title="Why This Score Was Given" icon={<Info size={16} />}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-green">Positive Factors</p>
            <ul className="mt-2 space-y-1.5">
              {report.positive_factors.map((f) => (
                <li key={f} className="text-sm text-ink-secondary">+ {f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-red">Areas Reducing the Score</p>
            <ul className="mt-2 space-y-1.5">
              {report.negative_factors.map((f) => (
                <li key={f} className="text-sm text-ink-secondary">− {f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* What to improve first */}
      <Section title="What to Improve First" icon={<Target size={16} />}>
        <ol className="space-y-2.5">
          {report.improvement_plan.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-ink-secondary">
              <span className="shrink-0 text-brand-light">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </Section>

      {/* Hook analysis */}
      <div className="flex gap-3 rounded-2xl border border-base-border bg-base-card p-5">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-light" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-light">Hook Analysis</p>
          <p className="mt-1.5 text-sm text-ink-secondary">{report.hook_analysis}</p>
        </div>
      </div>

      {/* Hook recommendations */}
      <Section title="Hook Recommendations" icon={<Sparkles size={16} />} defaultOpen={false}>
        <div className="grid gap-4 sm:grid-cols-2">
          {report.hook_recommendations.map((h) => (
            <div key={h.category} className="rounded-xl border border-base-border bg-base-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-light">{h.category}</p>
              <ul className="mt-2 space-y-1.5">
                {h.hooks.map((hook) => (
                  <li key={hook} className="text-sm text-ink-secondary">&quot;{hook}&quot;</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* New ad angles + creative improvements */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="New Ad Angles" icon={<Sparkles size={16} />} defaultOpen={false}>
          <ul className="space-y-1.5">
            {report.new_ad_angles.map((a) => (
              <li key={a} className="text-sm text-ink-secondary">• {a}</li>
            ))}
          </ul>
        </Section>
        <Section title="Creative Improvements" icon={<Layers size={16} />} defaultOpen={false}>
          <ul className="space-y-1.5">
            {report.creative_improvements.map((a) => (
              <li key={a} className="text-sm text-ink-secondary">• {a}</li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Audience inference */}
      <Section title="Audience Recommendations" icon={<Users size={16} />} defaultOpen={false}>
        <p className="mb-3 text-[11px] uppercase tracking-wide text-ink-muted">AI inference — not verified account data</p>
        <p className="text-sm text-ink-secondary">{report.audience_inference.likely_audience}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-ink-primary">Pain Points</p>
            <ul className="mt-1.5 space-y-1">
              {report.audience_inference.pain_points.map((p) => (
                <li key={p} className="text-xs text-ink-secondary">{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-primary">Desires</p>
            <ul className="mt-1.5 space-y-1">
              {report.audience_inference.desires.map((p) => (
                <li key={p} className="text-xs text-ink-secondary">{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-primary">Awareness Level</p>
            <p className="mt-1.5 text-xs text-ink-secondary">{report.audience_inference.awareness_level}</p>
          </div>
        </div>
      </Section>

      {/* Campaign recommendations */}
      <Section title="Campaign Recommendations" icon={<Megaphone size={16} />} defaultOpen={false}>
        <p className="mb-3 text-[11px] uppercase tracking-wide text-ink-muted">Recommendations — not your actual account configuration</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Objective", report.campaign_recommendations.objective],
            ["Optimization Event", report.campaign_recommendations.optimization_event],
            ["Testing Strategy", report.campaign_recommendations.testing_strategy],
            ["Placements", report.campaign_recommendations.placements],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-medium text-ink-primary">{label}</p>
              <p className="mt-1 text-xs text-ink-secondary">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Testing plan + variations */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Testing Plan" icon={<FlaskConical size={16} />} defaultOpen={false}>
          <ul className="space-y-2.5">
            {report.testing_plan.map((t) => (
              <li key={t.name} className="text-sm">
                <span className="text-ink-primary">{t.name}</span>
                <span className="text-ink-muted"> — isolates: {t.variable_isolated}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Creative Variations" icon={<Layers size={16} />} defaultOpen={false}>
          <ul className="space-y-2.5">
            {report.creative_variations.map((v) => (
              <li key={v.name} className="text-sm">
                <span className="text-ink-primary">{v.name}:</span>{" "}
                <span className="text-ink-secondary">{v.angle}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Final: creative readiness */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-base-border bg-base-card p-7 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Creative Readiness</p>
        <p className="text-3xl font-bold text-ink-primary">
          {report.creative_readiness_score}
          <span className="text-base text-ink-muted"> / 100</span>
        </p>
      </div>

      {showUpgradeCta && (
        <div className="rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/10 via-base-card to-base-card p-7 text-center shadow-glow">
          <p className="text-lg font-medium text-ink-primary">Want to analyze every creative you launch?</p>
          <p className="mt-2 text-sm text-ink-secondary">
            Unlock unlimited creative analysis, video analysis, and full creative intelligence with
            Creatively.ai.
          </p>
          <ButtonLink href="/signup" className="mt-5">
            Get Started
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
