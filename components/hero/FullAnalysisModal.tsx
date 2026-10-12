"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Gauge,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Sparkles,
  Palette,
  Type,
  Tag,
  ShieldCheck,
  MousePointerClick,
  FlaskConical,
  BarChart3,
  ListChecks,
  Layers,
  Megaphone,
  Info,
} from "lucide-react";
import { Section, VERDICT_TONE } from "@/components/marketing/CreativeReportView";
import { TONE } from "@/components/hero/AnalysisCard";
import type { DemoCreative } from "@/lib/demoCreative";

/*
 * The complete creative analysis behind "Show full analysis".
 *
 * Reads only from `creative` (the same object the phone and cards use), and
 * reuses the product's report building blocks: the collapsible Section and
 * verdict styles from CreativeReportView, and the CreativeReport fields
 * (score, signal scores, hooks, audience inference, campaign recommendations,
 * testing plan…) in `creative.report.core`.
 *
 * Opens as a modal over the landing page — no navigation, no effect on the
 * hero's scroll animation (the page's scroll position is untouched).
 */

type SectionId =
  | "score"
  | "overview"
  | "great"
  | "not-great"
  | "audience"
  | "hook"
  | "visual"
  | "copy"
  | "offer"
  | "trust"
  | "cta"
  | "tests"
  | "metrics"
  | "next";

const NAV: { id: SectionId; label: string }[] = [
  { id: "score", label: "Score" },
  { id: "overview", label: "Overview" },
  { id: "great", label: "What's great" },
  { id: "not-great", label: "What's not great" },
  { id: "audience", label: "Audience" },
  { id: "hook", label: "Hook" },
  { id: "visual", label: "Visual design" },
  { id: "copy", label: "Copy" },
  { id: "offer", label: "Offer" },
  { id: "trust", label: "Trust & claims" },
  { id: "cta", label: "CTA" },
  { id: "tests", label: "Tests" },
  { id: "metrics", label: "Campaign data" },
  { id: "next", label: "Next steps" },
];

const RATING_TONE: Record<string, string> = {
  Strong: "border-accent-green/30 bg-accent-green/10 text-[#4ADE80]",
  "Works well": "border-accent-green/30 bg-accent-green/10 text-[#4ADE80]",
  Moderate: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  Mixed: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  Weak: "border-accent-red/30 bg-accent-red/10 text-[#F87171]",
  "Could improve": "border-accent-red/30 bg-accent-red/10 text-[#F87171]",
};

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted ${className}`}>{children}</p>;
}

export function FullAnalysisModal({ creative, onClose }: { creative: DemoCreative; onClose: () => void }) {
  const r = creative.report;
  const core = r.core;
  const [great, notGreat] = creative.analysis.cards;

  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState<Set<SectionId>>(() => new Set<SectionId>(["overview", "great", "not-great"]));
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setVisible(false);
    window.setTimeout(onClose, 200); // matches the exit transition
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => setVisible(true));
    closeRef.current?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      // keep keyboard focus inside the dialog
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [close]);

  const toggle = (id: SectionId) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jump = (id: SectionId) => {
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>(`#fa-${id}`);
      if (el && bodyRef.current) {
        bodyRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
      }
    });
  };

  const sec = (id: SectionId) => ({ id: `fa-${id}`, open: open.has(id), onToggle: () => toggle(id) });

  return createPortal(
    <div
      className={`fixed inset-0 z-[999] isolate flex items-stretch justify-center bg-black/75 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-6 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fa-title"
        className={`relative flex h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden border-white/10 bg-[#0C0C10] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] transition-all duration-200 sm:h-[min(90vh,940px)] sm:rounded-[24px] sm:border ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        {/* header */}
        <div className="relative shrink-0 border-b border-white/[0.06] px-5 pb-3 pt-4 sm:px-7 sm:pt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24"
            style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(139,92,246,0.16), transparent 70%)" }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-brand-light">Full creative analysis</p>
              <h2 id="fa-title" className="mt-1 text-lg font-semibold text-white sm:text-xl">
                {creative.brand} · {creative.category}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill className="border-brand/30 bg-brand/10 text-brand-light">Visual creative assessment</Pill>
                <Pill className="border-white/10 bg-white/[0.04] text-ink-secondary">Example · no campaign data connected</Pill>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close full analysis"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ink-secondary transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
            >
              <X size={17} />
            </button>
          </div>

          {/* section navigation */}
          <nav aria-label="Report sections" className="relative -mx-5 mt-3 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-7 sm:px-7">
            <div className="flex w-max gap-1.5 pb-1">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => jump(n.id)}
                  className="whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-ink-secondary transition-colors hover:border-brand/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
                >
                  {n.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* body */}
        <div ref={bodyRef} className="relative min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6">
          {/* A — overall score */}
          <div id="fa-score" className="grid items-start gap-4 md:grid-cols-[168px_1fr]">
            <div className="hidden overflow-hidden rounded-2xl border border-base-border bg-black md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creative.image.src}
                alt={creative.image.alt}
                width={creative.image.width}
                height={creative.image.height}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="rounded-2xl border border-brand/40 bg-base-card p-5 shadow-glow sm:p-6">
              <Label>Overall creative score</Label>
              <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="text-[52px] font-semibold leading-none tracking-tight text-white">
                  {r.scoreOutOf10.toFixed(1)}
                  <span className="text-xl font-medium text-ink-muted"> / 10</span>
                </p>
                <div className="pb-1.5">
                  <p className="text-sm text-ink-primary">{core.verdict_label}</p>
                  <p className="text-xs text-ink-muted">{core.score} / 100 on the Creatively.ai scale</p>
                </div>
                <span className={`mb-1.5 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${VERDICT_TONE[core.final_recommendation.verdict]}`}>
                  {core.final_recommendation.verdict}
                </span>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-base-border" aria-hidden>
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light" style={{ width: `${r.scoreOutOf10 * 10}%` }} />
              </div>
              <p className="mt-3 text-sm text-ink-secondary">{core.summary}</p>
              <p className="mt-3 flex gap-2 text-xs leading-relaxed text-ink-muted">
                <Info size={14} className="mt-0.5 shrink-0" /> {r.scoreNote}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-base-border bg-base-card p-5">
            <Label>How the score breaks down</Label>
            <ul className="mt-3 divide-y divide-white/[0.05]">
              {r.scoreDimensions.map((d) => (
                <li key={d.name} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex items-center justify-between gap-3 sm:w-56 sm:shrink-0">
                    <span className="text-sm text-ink-primary">{d.name}</span>
                    <Pill className={RATING_TONE[d.rating]}>{d.rating}</Pill>
                  </span>
                  <span className="text-[13px] text-ink-secondary">{d.note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-base-border bg-base-card p-5">
            <Label>Executive summary</Label>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{core.executive_summary}</p>
            <div className="mt-4 grid gap-4 border-t border-base-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Biggest strength", core.biggest_strength, "text-accent-green"],
                ["Biggest weakness", core.biggest_weakness, "text-accent-red"],
                ["Biggest opportunity", core.biggest_opportunity, "text-brand-light"],
                ["Campaign readiness", core.campaign_readiness, "text-ink-primary"],
              ].map(([k, v, c]) => (
                <div key={k}>
                  <p className={`text-xs font-medium ${c}`}>{k}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <Section title="Signal breakdown (illustrative, out of 10)" icon={<Layers size={16} />} defaultOpen={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              {core.signal_scores.map((s) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-ink-secondary">{s.label}</span>
                    <span className="text-ink-primary">{(s.score ?? 0).toFixed(1)} / 10</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-border">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light" style={{ width: `${(s.score ?? 0) * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-5 border-t border-base-border pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent-green">Raising the score</p>
                <ul className="mt-2 space-y-1.5">
                  {core.positive_factors.map((f) => (
                    <li key={f} className="text-sm text-ink-secondary">+ {f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent-red">Holding it back</p>
                <ul className="mt-2 space-y-1.5">
                  {core.negative_factors.map((f) => (
                    <li key={f} className="text-sm text-ink-secondary">− {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* B — overview */}
          <Section title="Creative overview" icon={<FileText size={16} />} {...sec("overview")}>
            <dl className="divide-y divide-white/[0.05]">
              {r.overview.map((o) => (
                <div key={o.label} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
                  <dt className="text-xs text-ink-muted sm:w-44 sm:shrink-0 sm:pt-0.5">{o.label}</dt>
                  <dd className="flex flex-1 flex-wrap items-start justify-between gap-2 text-sm text-ink-primary">
                    <span className="min-w-0 flex-1">{o.value}</span>
                    <Pill
                      className={
                        o.basis === "Visible in the ad"
                          ? "border-white/10 bg-white/[0.04] text-ink-secondary"
                          : "border-brand/30 bg-brand/10 text-brand-light"
                      }
                    >
                      {o.basis}
                    </Pill>
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          {/* C — what's great */}
          <Section title="What's great" icon={<TrendingUp size={16} className="text-[#4ADE80]" />} {...sec("great")}>
            <FindingList findings={great.findings} rgb={TONE.green.rgb} whyLabel="Why it may help" />
            <p className="mt-3 text-[11px] text-ink-muted">Observations about how the creative communicates — not proof that it increases conversions.</p>
          </Section>

          {/* D — what's not great */}
          <Section title="What's not great" icon={<TrendingDown size={16} className="text-[#F87171]" />} {...sec("not-great")}>
            <FindingList findings={notGreat.findings} rgb={TONE.red.rgb} whyLabel="Why it matters" />
          </Section>

          {/* E — audience */}
          <Section title="Recommended audience" icon={<Users size={16} />} {...sec("audience")}>
            <p className="mb-4 text-[11px] uppercase tracking-wide text-ink-muted">
              Hypotheses for audience testing — not Buffy’s actual customers or verified performance
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {r.audiences.map((a) => (
                <div key={a.name} className="rounded-xl border border-base-border bg-base-surface p-4">
                  <p className="text-sm font-medium text-ink-primary">{a.name}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{a.why}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {a.signals.map((sig) => (
                      <li key={sig}>
                        <Pill className="border-white/10 bg-white/[0.03] text-ink-secondary">{sig}</Pill>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 border-t border-base-border pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-ink-primary">Likely pain points</p>
                <ul className="mt-1.5 space-y-1">
                  {core.audience_inference.pain_points.map((p) => (
                    <li key={p} className="text-xs text-ink-secondary">{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-primary">Likely desires</p>
                <ul className="mt-1.5 space-y-1">
                  {core.audience_inference.desires.map((p) => (
                    <li key={p} className="text-xs text-ink-secondary">{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-primary">Awareness level</p>
                <p className="mt-1.5 text-xs text-ink-secondary">{core.audience_inference.awareness_level}</p>
              </div>
            </div>
          </Section>

          {/* F — hook */}
          <Section title="Hook and headline" icon={<Sparkles size={16} />} {...sec("hook")}>
            <p className="text-base text-white">{r.hook.headline}</p>
            <p className="mt-2 text-sm text-ink-secondary">{core.hook_analysis}</p>
            <AspectList items={r.hook.checks.map((c) => ({ k: c.aspect, v: c.note }))} />
            <div className="mt-4 rounded-xl border border-accent-red/25 bg-accent-red/[0.06] p-4">
              <p className="text-xs font-medium text-[#F87171]">Principal weakness</p>
              <p className="mt-1 text-sm text-ink-secondary">{r.hook.mainWeakness}</p>
            </div>
            <Label className="mt-5">Alternative hooks — suggestions to test, not proven winners</Label>
            <ul className="mt-2 space-y-2">
              {r.hook.alternatives.map((a) => (
                <li key={a.text} className="rounded-xl border border-brand/20 bg-brand/[0.05] p-3">
                  <p className="text-sm text-white">{a.text}</p>
                  <p className="mt-0.5 text-xs text-ink-secondary">{a.note}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {core.hook_recommendations.map((h) => (
                <div key={h.category} className="rounded-xl border border-base-border bg-base-surface p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-light">{h.category}</p>
                  {h.hooks.map((hook) => (
                    <p key={hook} className="mt-1 text-sm text-ink-secondary">“{hook}”</p>
                  ))}
                </div>
              ))}
            </div>
          </Section>

          {/* G — visual */}
          <Section title="Visual design" icon={<Palette size={16} />} {...sec("visual")}>
            <ul className="divide-y divide-white/[0.05]">
              {r.visual.map((v) => (
                <li key={v.aspect} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
                  <span className="flex items-center justify-between gap-3 sm:w-60 sm:shrink-0">
                    <span className="text-sm text-ink-primary">{v.aspect}</span>
                    <Pill className={RATING_TONE[v.verdict]}>{v.verdict}</Pill>
                  </span>
                  <span className="text-[13px] text-ink-secondary">{v.note}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* H — copy */}
          <Section title="Copy and messaging" icon={<Type size={16} />} {...sec("copy")}>
            <ul className="space-y-3">
              {r.copy.map((c) => (
                <li key={c.element}>
                  <p className="text-xs font-medium text-ink-primary">{c.element}</p>
                  {c.text && <p className="mt-0.5 text-sm italic text-white/85">“{c.text}”</p>}
                  <p className="mt-0.5 text-[13px] text-ink-secondary">{c.note}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.05] p-4">
              <p className="text-xs font-medium text-brand-light">Where the message could be more specific</p>
              <p className="mt-1 text-sm text-ink-secondary">{r.copyOpportunity}</p>
            </div>
          </Section>

          {/* I — offer */}
          <Section title="Offer and value proposition" icon={<Tag size={16} />} {...sec("offer")}>
            <p className="text-xs font-medium text-ink-primary">Visible offer</p>
            <p className="mt-0.5 text-sm text-ink-secondary">{r.offer.visible}</p>
            <p className="mt-3 text-xs font-medium text-ink-primary">Assessment</p>
            <p className="mt-0.5 text-sm text-ink-secondary">{r.offer.assessment}</p>
            <p className="mt-3 text-xs font-medium text-ink-primary">How the value proposition could be clarified</p>
            <ul className="mt-1 space-y-1">
              {r.offer.clarify.map((c) => (
                <li key={c} className="text-sm text-ink-secondary">• {c}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200/90">{r.offer.testNote}</p>
          </Section>

          {/* J — trust */}
          <Section title="Trust and claim review" icon={<ShieldCheck size={16} />} {...sec("trust")}>
            <Label>Claims visible in the ad</Label>
            <ul className="mt-2 divide-y divide-white/[0.05]">
              {r.trust.claims.map((c) => (
                <li key={c.claim} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                  <span className="text-sm text-white sm:w-52 sm:shrink-0">“{c.claim}”</span>
                  <span className="text-[13px] text-ink-secondary">{c.note}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1">
              {r.trust.notes.map((n) => (
                <li key={n} className="text-sm text-ink-secondary">• {n}</li>
              ))}
            </ul>
          </Section>

          {/* K — CTA */}
          <Section title="CTA analysis" icon={<MousePointerClick size={16} />} {...sec("cta")}>
            <p className="text-base text-white">“SHOP NOW”</p>
            <AspectList items={r.cta.checks.map((c) => ({ k: c.aspect, v: c.note }))} />
            <Label className="mt-4">Alternative CTA concepts</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.cta.alternatives.map((a) => (
                <Pill key={a} className="border-brand/25 bg-brand/[0.06] text-brand-light">{a}</Pill>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">{r.cta.note}</p>
          </Section>

          {/* L — tests */}
          <Section title="Recommended creative tests" icon={<FlaskConical size={16} />} {...sec("tests")}>
            <p className="mb-3 text-[11px] uppercase tracking-wide text-ink-muted">
              Prioritised by rationale, not statistical certainty · no baseline or result values exist for this demo
            </p>
            <ol className="space-y-3">
              {r.tests.map((t) => (
                <li key={t.name} className="rounded-xl border border-base-border bg-base-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-light">
                      {t.priority}
                    </span>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    {t.condition && <Pill className="border-amber-400/25 bg-amber-400/[0.08] text-amber-200/90">{t.condition}</Pill>}
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
                    {[
                      ["Hypothesis", t.hypothesis],
                      ["What changes", t.changes],
                      ["What stays the same", t.staysSame],
                      ["Metric to monitor", t.metric],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-ink-muted">{k}</dt>
                        <dd className="text-ink-secondary">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ol>
            <div className="mt-4 grid gap-4 border-t border-base-border pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-ink-primary">Creative variations</p>
                <ul className="mt-1.5 space-y-1.5">
                  {core.creative_variations.map((v) => (
                    <li key={v.name} className="text-[13px] text-ink-secondary">
                      <span className="text-ink-primary">{v.name}:</span> {v.angle}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-primary">New ad angles</p>
                <ul className="mt-1.5 space-y-1.5">
                  {core.new_ad_angles.map((a) => (
                    <li key={a} className="text-[13px] text-ink-secondary">• {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* M — campaign data */}
          <Section title="Performance metrics and campaign data" icon={<BarChart3 size={16} />} {...sec("metrics")}>
            <p className="text-sm text-ink-secondary">
              Creatively.ai can show these metrics for ads in a connected ad account. This demo has no campaign data, so none are
              shown — the observations in this report are about the creative itself, not its performance.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {r.metrics.map((m) => (
                <div key={m} className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-ink-muted">{m}</p>
                  <p className="mt-1 text-sm text-ink-secondary">Not available</p>
                  <p className="text-[10.5px] text-ink-muted">Connect campaign data</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-base-border pt-4">
              <p className="flex items-center gap-2 text-xs font-medium text-ink-primary">
                <Megaphone size={14} className="text-brand-light" /> Campaign recommendations
              </p>
              <p className="mb-2 mt-0.5 text-[11px] text-ink-muted">Suggestions — not an actual account configuration</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Objective", core.campaign_recommendations.objective],
                  ["Optimization event", core.campaign_recommendations.optimization_event],
                  ["Testing strategy", core.campaign_recommendations.testing_strategy],
                  ["Placements", core.campaign_recommendations.placements],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-ink-primary">{k}</p>
                    <p className="mt-0.5 text-xs text-ink-secondary">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-muted">{core.expected_impact}</p>
            </div>
          </Section>

          {/* N — next steps */}
          <Section title="Final recommendations" icon={<ListChecks size={16} />} {...sec("next")}>
            <ol className="space-y-3">
              {r.finalRecommendations.map((f, i) => (
                <li key={f.action} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-light">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{f.action}</p>
                    <p className="mt-0.5 text-[13px] text-ink-secondary">{f.why}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-border bg-base-surface p-4">
              <div>
                <p className="text-xs text-ink-muted">Verdict</p>
                <p className="mt-0.5 text-sm text-ink-secondary">{core.final_recommendation.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">Creative readiness (illustrative)</p>
                <p className="text-xl font-semibold text-white">
                  {core.creative_readiness_score}
                  <span className="text-sm text-ink-muted"> / 100</span>
                </p>
              </div>
            </div>
          </Section>

          <p className="flex items-center justify-center gap-1.5 pb-2 pt-1 text-center text-[11px] text-ink-muted">
            <Gauge size={12} /> {creative.analysis.disclaimer}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FindingList({
  findings,
  rgb,
  whyLabel,
}: {
  findings: { label: string; detail: string; why?: string }[];
  rgb: string;
  whyLabel: string;
}) {
  return (
    <ol className="space-y-3">
      {findings.map((f, i) => (
        <li key={f.label} className="rounded-xl border bg-base-surface p-4" style={{ borderColor: `rgba(${rgb},0.22)` }}>
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
              style={{ background: `rgba(${rgb},0.14)`, color: `rgb(${rgb})` }}
            >
              {i + 1}
            </span>
            {f.label}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{f.detail}</p>
          {f.why && (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
              <span className="font-medium" style={{ color: `rgb(${rgb})` }}>
                {whyLabel}:{" "}
              </span>
              {f.why}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function AspectList({ items }: { items: { k: string; v: string }[] }) {
  return (
    <dl className="mt-3 divide-y divide-white/[0.05]">
      {items.map((it) => (
        <div key={it.k} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
          <dt className="text-xs text-ink-muted sm:w-44 sm:shrink-0 sm:pt-0.5">{it.k}</dt>
          <dd className="text-[13px] text-ink-secondary">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}
