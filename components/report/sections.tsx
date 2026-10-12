"use client";

/* eslint-disable @next/next/no-img-element -- user uploads and blob: previews */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Columns2, Crosshair, LayoutGrid, Minus, Plus, RotateCcw } from "lucide-react";
import type { ReportCtx } from "@/components/report/ReportExperience";
import { FINAL_VERDICT_TEXT } from "@/components/report/ReportExperience";
import { SIGNAL_GROUPS } from "@/lib/reportView";
import {
  CopyButton,
  EFFORT_TONE,
  Expandable,
  Field,
  MiniList,
  PRIORITY_TONE,
  ReportSection,
  Tag,
  ToggleRow,
  has,
  useDisclosure,
} from "@/components/report/primitives";
import { scoreColor } from "@/components/report/ScoreGauge";

type P = { ctx: ReportCtx; index: number };

function InspectButton({ ctx, annId }: { ctx: ReportCtx; annId?: string | null }) {
  const i = ctx.annIndex(annId);
  if (i < 0 || !annId) return null;
  return (
    <button type="button" onClick={() => ctx.inspect(annId)} className="rp-btn-ghost">
      <Crosshair size={14} aria-hidden /> Inspect on creative
      <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]">{i + 1}</span>
    </button>
  );
}

/* ── 03 Executive summary ────────────────────────────────────────────── */

export function SummarySection({ ctx, index }: P) {
  const { view } = ctx;
  const d = useDisclosure(false);
  const cards: { label: string; text: string; tag?: string; accent?: string }[] = [
    { label: "What it says", text: view.summary.message },
    { label: "Who it seems to target", text: view.summary.audience, tag: "Inference" },
    { label: "Strongest element", text: view.summary.strongest, accent: "text-accent-green" },
    { label: "Biggest weakness", text: view.summary.weakest, accent: "text-[#F87171]" },
    { label: "Main opportunity", text: view.summary.opportunity, accent: "text-brand-light" },
    { label: "Next action", text: view.summary.next_action },
  ].filter((c) => has(c.text));
  if (!cards.length && !has(view.executiveSummary)) return null;

  return (
    <ReportSection id="rp-summary" index={index} title="Executive summary" kicker={cards.length === 6 ? "The report in six points." : undefined}>
      {cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <div key={c.label} className="rp-card p-4" data-rv style={{ ["--d" as string]: i }}>
              <p className={`rp-field-label flex items-center gap-2 ${c.accent ?? ""}`}>
                {c.label}
                {c.tag && <Tag className="normal-case tracking-normal">{c.tag}</Tag>}
              </p>
              <p className="text-sm leading-relaxed text-ink-primary/90">{c.text}</p>
            </div>
          ))}
        </div>
      )}
      {has(view.executiveSummary) && (
        <div className="mt-4" data-rv>
          <ToggleRow open={d.open} onClick={d.toggle} controls={d.id}>
            {d.open ? "Hide full analysis" : "Read full analysis"}
          </ToggleRow>
          <Expandable open={d.open} id={d.id}>
            <p className="mt-3 max-w-3xl border-l-2 border-brand/40 pl-4 text-[15px] leading-relaxed text-ink-secondary">
              {view.executiveSummary}
            </p>
          </Expandable>
        </div>
      )}
    </ReportSection>
  );
}

/* ── 04 What's great ─────────────────────────────────────────────────── */

export function StrengthsSection({ ctx, index }: P) {
  const { view } = ctx;
  return (
    <ReportSection id="rp-strengths" index={index} title="What's great" kicker="What is working, the evidence for it, and what to protect when you make new versions.">
      <div className="grid gap-3 md:grid-cols-2">
        {view.strengths.map((s, i) => (
          <article key={i} id={`rp-strength-${i}`} className="rp-card rp-card-good p-5" data-rv style={{ ["--d" as string]: i }}>
            <h3 className="flex items-start gap-2.5 text-[15px] font-semibold leading-snug text-ink-primary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-green/15 text-accent-green">
                <Check size={12} aria-hidden strokeWidth={3} />
              </span>
              {s.title}
            </h3>
            {has(s.evidence, s.why, s.keep) && (
              <dl className="mt-3 space-y-2.5 pl-[30px]">
                <Field label="Observed">{s.evidence}</Field>
                <Field label="Why it helps" muted>{s.why}</Field>
                <Field label="Keep it">{s.keep}</Field>
              </dl>
            )}
            {s.annotation && ctx.annIndex(s.annotation) >= 0 && (
              <div className="mt-3 pl-[30px]">
                <InspectButton ctx={ctx} annId={s.annotation} />
              </div>
            )}
          </article>
        ))}
      </div>
    </ReportSection>
  );
}

/* ── 05 Priority fixes (diagnosis) ───────────────────────────────────── */

export function FixesSection({ ctx, index }: P) {
  const { view } = ctx;
  return (
    <ReportSection id="rp-fixes" index={index} title="Priority fixes" kicker="What is holding the creative back, where it is, and why it matters. The changes themselves are in Improve first.">
      <div className="space-y-3">
        {view.fixes.map((f, i) => (
          <article key={i} id={`rp-fix-${i}`} className="rp-card rp-card-bad p-5" data-rv style={{ ["--d" as string]: i }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="flex items-start gap-2.5 text-[15px] font-semibold leading-snug text-ink-primary">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-red/15 text-[11px] font-semibold text-[#F87171]">
                  {i + 1}
                </span>
                {f.issue}
              </h3>
              <div className="flex gap-1.5 pl-[30px] sm:pl-0">
                <Tag tone={PRIORITY_TONE[f.priority]}>{f.priority} priority</Tag>
              </div>
            </div>
            {has(f.where, f.why) && (
              <dl className="mt-3 grid gap-3 pl-[30px] sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <Field label="Where">{f.where}</Field>
                <Field label="Why it matters" muted>{f.why}</Field>
              </dl>
            )}
            <div className="mt-3 flex flex-wrap gap-2 pl-[30px]">
              <InspectButton ctx={ctx} annId={f.annotation} />
              <button type="button" className="rp-btn-ghost" onClick={() => ctx.goTo("rp-improve", `rp-improve-${i}`)}>
                See the fix <ArrowRight size={14} aria-hidden />
              </button>
            </div>
          </article>
        ))}
      </div>
      {has(view.expectedImpact) && (
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4" data-rv>
          <p className="rp-field-label">Expected impact if fixed</p>
          <p className="text-sm leading-relaxed text-ink-secondary">{view.expectedImpact}</p>
          <p className="mt-2 text-[11px] text-ink-muted">A hypothesis about the creative, not a performance forecast.</p>
        </div>
      )}
    </ReportSection>
  );
}

/* ── 06 Signal breakdown ─────────────────────────────────────────────── */

export function SignalsSection({ ctx, index }: P) {
  const { view } = ctx;
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const used = new Set<string>();
    const out = SIGNAL_GROUPS.map((g) => {
      const signals = g.labels
        .map((l) => view.signals.find((s) => s.label.toLowerCase() === l.toLowerCase()))
        .filter((s): s is NonNullable<typeof s> => !!s);
      signals.forEach((s) => used.add(s.label));
      return { name: g.name, signals };
    });
    const rest = view.signals.filter((s) => !used.has(s.label));
    if (rest.length) out[out.length - 1].signals.push(...rest);
    return out.filter((g) => g.signals.length);
  }, [view.signals]);

  return (
    <ReportSection
      id="rp-signals"
      index={index}
      title="Signal breakdown"
      kicker={`${view.signals.length} signals scored from 0 to 10, grouped by what they measure.${
        view.signals.some((s) => has(s.reason)) ? " Select a signal to see the reasoning." : ""
      }`}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map((g, gi) => {
          const scored = g.signals.filter((s) => s.score !== null);
          const avg = scored.length ? scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length : null;
          return (
            <div key={g.name} className="rp-card p-4 sm:p-5" data-rv style={{ ["--d" as string]: gi }}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink-primary">{g.name}</h3>
                {avg !== null && (
                  <p className="text-xs text-ink-muted">
                    Group average{" "}
                    <span className="font-semibold tabular-nums" style={{ color: scoreColor(avg * 10) }}>
                      {avg.toFixed(1)}
                    </span>
                  </p>
                )}
              </div>
              <ul className="space-y-1">
                {g.signals.map((s, si) => {
                  const key = s.label;
                  const isOpen = open === key;
                  const explain = has(s.reason, s.improve);
                  const panelId = `sig-${gi}-${si}`;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        disabled={!explain}
                        onClick={() => setOpen(isOpen ? null : key)}
                        aria-expanded={explain ? isOpen : undefined}
                        aria-controls={explain ? panelId : undefined}
                        className="group/sig -mx-2 grid w-[calc(100%+16px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 text-left transition-colors enabled:hover:bg-white/[0.03] sm:grid-cols-[150px_minmax(0,1fr)_40px]"
                      >
                        <span className="flex items-center gap-1.5 text-[13px] text-ink-secondary group-enabled/sig:group-hover/sig:text-ink-primary">
                          {s.label}
                        </span>
                        <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06] sm:order-none sm:col-span-1">
                          {s.score !== null && (
                            <span
                              className="rp-bar block h-full rounded-full"
                              style={{ width: `${s.score * 10}%`, ["--d" as string]: si }}
                            />
                          )}
                        </span>
                        <span className="text-right text-[13px] font-semibold tabular-nums" style={{ color: s.score === null ? undefined : scoreColor(s.score * 10) }}>
                          {s.score === null ? <span className="text-[11px] font-normal text-ink-muted">n/a</span> : s.score.toFixed(s.score % 1 ? 1 : 0)}
                        </span>
                      </button>
                      {explain && (
                        <Expandable open={isOpen} id={panelId}>
                          <dl className="mb-2 mt-1 space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                            {s.score === null && <p className="text-xs text-amber-300">Not enough evidence in the image to score this.</p>}
                            <Field label="Why this score">{s.reason}</Field>
                            <Field label="To raise it" muted>{s.improve}</Field>
                          </dl>
                        </Expandable>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-muted" data-rv>
        The Creative Score rates the creative itself against advertising best practice. It does not predict or guarantee
        CTR, ROAS, conversions or sales. For Creative Fatigue Risk, a higher score means the creative looks fresher.
        &ldquo;n/a&rdquo; means the image did not give enough evidence to score that signal.
      </p>
    </ReportSection>
  );
}

/* ── 07 Why this score ───────────────────────────────────────────────── */

export function WhyScoreSection({ ctx, index }: P) {
  const { view } = ctx;
  const scored = view.signals.filter((s) => s.score !== null) as { label: string; score: number }[];
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
  const low = [...scored].sort((a, b) => a.score - b.score).slice(0, 3);

  const Col = ({
    title,
    items,
    tone,
    sigs,
  }: {
    title: string;
    items: string[];
    tone: "good" | "bad";
    sigs: { label: string; score: number }[];
  }) => (
    <div className={`rp-card p-5 ${tone === "good" ? "rp-card-good" : "rp-card-bad"}`} data-rv>
      <h3 className={`flex items-center gap-2 text-sm font-semibold ${tone === "good" ? "text-accent-green" : "text-[#F87171]"}`}>
        {tone === "good" ? <Plus size={15} aria-hidden /> : <Minus size={15} aria-hidden />}
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-primary/90">
            <span aria-hidden className={`mt-[9px] h-1 w-3 shrink-0 rounded-full ${tone === "good" ? "bg-accent-green/60" : "bg-[#F87171]/60"}`} />
            {x}
          </li>
        ))}
      </ul>
      {sigs.length > 0 && (
        <div className="mt-4 border-t border-white/[0.06] pt-3">
          <p className="rp-field-label">{tone === "good" ? "Highest signals" : "Lowest signals"}</p>
          <div className="flex flex-wrap gap-1.5">
            {sigs.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => ctx.goTo("rp-signals")}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-ink-secondary transition-colors hover:border-white/20 hover:text-ink-primary"
              >
                {s.label}
                <span className="font-semibold tabular-nums" style={{ color: scoreColor(s.score * 10) }}>
                  {s.score}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ReportSection id="rp-why" index={index} title="Why this score" kicker={`What pushed the score up, and what kept it at ${view.score}.`}>
      <div className="grid gap-3 md:grid-cols-2">
        {view.positive.length > 0 && <Col title="Supporting the score" items={view.positive} tone="good" sigs={top} />}
        {view.negative.length > 0 && <Col title="Holding it back" items={view.negative} tone="bad" sigs={low} />}
      </div>
    </ReportSection>
  );
}

/* ── 08 Improve first (action workspace) ─────────────────────────────── */

function useDone(reportId?: string) {
  const key = reportId ? `cai_done_${reportId}` : null;
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, [key]);
  const toggle = (i: number) =>
    setDone((d) => {
      const next = d.includes(i) ? d.filter((x) => x !== i) : [...d, i];
      try {
        if (key) localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  return { enabled: !!key, done, toggle };
}

export function ImproveFirstSection({ ctx, index }: P) {
  const { view } = ctx;
  const { enabled, done, toggle } = useDone(ctx.reportId);
  const count = done.filter((i) => i < view.fixes.length).length;

  return (
    <ReportSection
      id="rp-improve"
      index={index}
      title="What to improve first"
      kicker="The fixes in order. Each one has the change to make, an example and the effect we expect."
      aside={
        enabled ? (
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-ink-primary tabular-nums">{count}</span> of {view.fixes.length} done
            <span className="hidden sm:inline"> · saved on this device</span>
          </p>
        ) : undefined
      }
    >
      <ol className="space-y-3">
        {view.fixes.map((f, i) => {
          const isDone = done.includes(i);
          const first = i === 0;
          return (
            <li
              key={i}
              id={`rp-improve-${i}`}
              className={`rp-card relative p-5 transition-opacity ${first ? "rp-card-first" : ""} ${isDone ? "opacity-60" : ""}`}
              data-rv
              style={{ ["--d" as string]: i }}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {first && <Tag tone="brand">Start here</Tag>}
                <Tag tone={PRIORITY_TONE[f.priority]}>{f.priority} priority</Tag>
                <Tag tone={EFFORT_TONE[f.effort]}>{f.effort} effort</Tag>
              </div>
              <h3 className={`mt-3 text-base font-semibold leading-snug text-ink-primary ${isDone ? "line-through decoration-ink-muted" : ""}`}>
                {f.fix || f.issue}
              </h3>
              {f.fix && <p className="mt-1 text-xs text-ink-muted">Fixes: {f.issue}</p>}
              {has(f.example) && (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-white/[0.07] bg-black/30 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="rp-field-label">Example</p>
                    <p className="text-sm leading-relaxed text-ink-primary">{f.example}</p>
                  </div>
                  <CopyButton text={f.example} label="Copy example" compact />
                </div>
              )}
              {has(f.impact) && (
                <dl className="mt-3">
                  <Field label="Expected effect (hypothesis)" muted>
                    {f.impact}
                  </Field>
                </dl>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <InspectButton ctx={ctx} annId={f.annotation} />
                <CopyButton text={[f.fix || f.issue, f.example && `Example: ${f.example}`].filter(Boolean).join("\n")} label="Copy fix" />
                {enabled && (
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-pressed={isDone}
                    className={`rp-btn-ghost ${isDone ? "border-accent-green/40 text-accent-green" : ""}`}
                  >
                    {isDone ? <RotateCcw size={14} aria-hidden /> : <Check size={14} aria-hidden />}
                    {isDone ? "Mark as not done" : "Mark as done"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </ReportSection>
  );
}

/* ── 09 Hooks ────────────────────────────────────────────────────────── */

const LEVEL = { High: 3, Medium: 2, Low: 1 } as const;
function Meter({ label, level }: { label: string; level: keyof typeof LEVEL }) {
  return (
    <div>
      <p className="rp-field-label">{label}</p>
      <div className="flex items-center gap-2">
        <span className="flex gap-1" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 w-5 rounded-full ${n <= LEVEL[level] ? "bg-brand-light" : "bg-white/10"}`} />
          ))}
        </span>
        <span className="text-xs text-ink-primary">{level}</span>
      </div>
    </div>
  );
}

export function HooksSection({ ctx, index }: P) {
  const { view } = ctx;
  const h = view.hook;
  if (!h && !has(view.hookAnalysis) && !view.hookIdeas.length) return null;
  return (
    <ReportSection id="rp-hooks" index={index} title="Hook analysis" kicker="How the current headline works, and new hooks worth testing against it.">
      {h ? (
        <div className="rp-card overflow-hidden" data-rv>
          <div className="border-b border-white/[0.06] bg-gradient-to-br from-brand/[0.08] to-transparent p-5 sm:p-6">
            <p className="rp-field-label">Current hook{has(h.type) ? ` · ${h.type}` : ""}</p>
            <blockquote className="text-xl font-semibold leading-snug tracking-tight text-ink-primary sm:text-2xl">
              {h.text === "No clear headline" ? <span className="text-ink-muted">No clear headline</span> : <>&ldquo;{h.text}&rdquo;</>}
            </blockquote>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
            <Meter label="Clarity" level={h.clarity} />
            <Meter label="Specificity" level={h.specificity} />
            <div>
              <p className="rp-field-label">Emotional angle</p>
              <p className="text-sm text-ink-primary">{h.emotional_angle || "Not stated"}</p>
            </div>
          </div>
          {has(h.strength, h.limitation) && (
            <dl className="grid gap-4 border-t border-white/[0.06] p-5 sm:grid-cols-2 sm:p-6">
              <Field label="What works">{h.strength}</Field>
              <Field label="What limits it" muted>{h.limitation}</Field>
            </dl>
          )}
        </div>
      ) : (
        has(view.hookAnalysis) && (
          <p className="rp-card p-5 text-sm leading-relaxed text-ink-secondary" data-rv>
            {view.hookAnalysis}
          </p>
        )
      )}

      {view.hookIdeas.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-sm font-semibold text-ink-primary" data-rv>
            Hooks to test
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {view.hookIdeas.map((x, i) => (
              <div key={i} className="rp-card rp-lift group/hook flex flex-col p-4" data-rv style={{ ["--d" as string]: i }}>
                <div className="flex items-center justify-between gap-2">
                  <Tag tone="brand">{x.category}</Tag>
                  <CopyButton text={x.hook} label="Copy hook" compact className="rp-reveal-action" />
                </div>
                <p className="mt-3 text-[15px] font-medium leading-snug text-ink-primary">&ldquo;{x.hook}&rdquo;</p>
                {has(x.why, x.changes) && (
                  <dl className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                    <Field label="Why test it" muted>{x.why}</Field>
                    <Field label="What changes" muted>{x.changes}</Field>
                  </dl>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">Suggestions to test, not proven winners.</p>
        </>
      )}
    </ReportSection>
  );
}

/* ── 10 Angles + improvements ────────────────────────────────────────── */

export function AnglesSection({ ctx, index }: P) {
  const { view } = ctx;
  return (
    <ReportSection id="rp-angles" index={index} title="New angles and improvements" kicker="Different ways to sell the same product, then specific edits to the current creative.">
      {view.angles.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-3">
          {view.angles.map((a, i) => (
            <article key={i} className="rp-card rp-lift flex flex-col p-5" data-rv style={{ ["--d" as string]: i }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-brand-light">Angle {i + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-ink-primary">{a.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-primary/90">{a.message}</p>
              {has(a.hook, a.offer, a.visual, a.cta, a.hypothesis) && (
                <dl className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-4">
                  <Field label="Hook">{a.hook && <>&ldquo;{a.hook}&rdquo;</>}</Field>
                  <Field label="Offer" muted>{a.offer}</Field>
                  <Field label="Visual" muted>{a.visual}</Field>
                  <Field label="CTA">{a.cta}</Field>
                  <Field label="Hypothesis" muted>{a.hypothesis}</Field>
                </dl>
              )}
              <div className="mt-auto pt-4">
                <CopyButton
                  text={[`${a.name}: ${a.message}`, a.hook && `Hook: ${a.hook}`, a.offer && `Offer: ${a.offer}`, a.visual && `Visual: ${a.visual}`, a.cta && `CTA: ${a.cta}`, a.hypothesis && `Hypothesis: ${a.hypothesis}`]
                    .filter(Boolean)
                    .join("\n")}
                  label="Copy angle"
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {view.improvements.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-sm font-semibold text-ink-primary" data-rv>
            Creative improvements
          </h3>
          <ul className="overflow-hidden rounded-xl border border-white/[0.07]" data-rv>
            {view.improvements.map((x, i) => (
              <li
                key={i}
                className="grid gap-2 border-b border-white/[0.06] bg-base-card p-4 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)_20px_minmax(0,1fr)] sm:items-start sm:gap-4"
              >
                {has(x.area) ? <Tag tone="brand" className="w-fit">{x.area}</Tag> : <span className="hidden sm:block" />}
                {has(x.before) ? (
                  <p className="text-sm leading-relaxed text-ink-muted">
                    <span className="sr-only">Now: </span>
                    {x.before}
                  </p>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <ArrowRight size={14} className={`mt-1 hidden text-ink-muted ${has(x.before) ? "sm:block" : ""}`} aria-hidden />
                <p className="text-sm leading-relaxed text-ink-primary">
                  <span className="sr-only">Change to: </span>
                  {x.after}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </ReportSection>
  );
}

/* ── 11 Variations ───────────────────────────────────────────────────── */

export function VariationsSection({ ctx, index }: P) {
  const { view, imageUrl } = ctx;
  const [mode, setMode] = useState<"grid" | "compare">("grid");
  const [sel, setSel] = useState(0);
  const v = view.variations[sel] ?? view.variations[0];
  const brief = (x: typeof v) =>
    [x.name, x.focus && `Focus: ${x.focus}`, x.headline && `Headline: ${x.headline}`, x.changes && `Change: ${x.changes}`, x.why && `Why: ${x.why}`, x.hypothesis && `Hypothesis: ${x.hypothesis}`, x.keep && `Keep: ${x.keep}`, x.layout && `Layout: ${x.layout}`]
      .filter(Boolean)
      .join("\n");

  return (
    <ReportSection
      id="rp-variations"
      index={index}
      title="Creative variations"
      kicker="Three briefs for new versions, each changing one thing. Hand them to a designer or use them in your own editor."
      aside={
        <div role="tablist" aria-label="Variation view" className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {(
            [
              ["grid", "All briefs", LayoutGrid],
              ["compare", "Original vs variation", Columns2],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              type="button"
              onClick={() => setMode(m)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                mode === m ? "bg-white/10 text-ink-primary" : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon size={13} aria-hidden /> {label}
            </button>
          ))}
        </div>
      }
    >
      {mode === "grid" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rp-card flex flex-col p-4" data-rv>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">Original</p>
            {imageUrl && (
              <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.06] bg-black/40">
                <img src={imageUrl} alt="Original creative" className="mx-auto block max-h-56 w-auto object-contain" />
              </div>
            )}
            {view.hook && view.hook.text !== "No clear headline" && (
              <p className="mt-3 text-sm font-medium leading-snug text-ink-primary">&ldquo;{view.hook.text}&rdquo;</p>
            )}
            <p className="mt-2 text-xs text-ink-muted">Score {view.score}</p>
          </div>
          {view.variations.map((x, i) => (
            <article key={i} className="rp-card rp-lift flex flex-col p-4" data-rv style={{ ["--d" as string]: i + 1 }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-brand-light">{x.name}</p>
                {has(x.focus) && <Tag tone="brand">{x.focus}</Tag>}
              </div>
              {has(x.headline) && <p className="mt-3 text-[15px] font-semibold leading-snug text-ink-primary">&ldquo;{x.headline}&rdquo;</p>}
              <dl className="mt-3 space-y-2.5">
                <Field label="What changes">{x.changes}</Field>
                <Field label="Why" muted>{x.why}</Field>
                <Field label="Hypothesis" muted>{x.hypothesis}</Field>
                <Field label="Stays the same" muted>{x.keep}</Field>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <CopyButton text={brief(x)} label="Copy brief" />
                <button
                  type="button"
                  className="rp-btn-ghost"
                  onClick={() => {
                    setSel(i);
                    setMode("compare");
                  }}
                >
                  <Columns2 size={14} aria-hidden /> Compare
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rp-pop">
          <div role="tablist" aria-label="Choose a variation" className="mb-4 flex flex-wrap gap-1.5">
            {view.variations.map((x, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={sel === i}
                onClick={() => setSel(i)}
                className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors ${
                  sel === i ? "border-brand/50 bg-brand/15 text-ink-primary" : "border-white/10 text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {x.name}
                {has(x.focus) && <span className="ml-1 text-ink-muted">· {x.focus}</span>}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rp-card p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">Original</p>
              {imageUrl && (
                <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.06] bg-black/40">
                  <img src={imageUrl} alt="Original creative" className="mx-auto block max-h-72 w-auto object-contain" />
                </div>
              )}
              <dl className="mt-4 space-y-2.5">
                <Field label="Headline">{view.hook?.text && view.hook.text !== "No clear headline" ? <>&ldquo;{view.hook.text}&rdquo;</> : "No clear headline"}</Field>
                <Field label="Weakest point" muted>{view.summary.weakest}</Field>
              </dl>
            </div>
            <div key={sel} className="rp-card rp-card-first rp-pop p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-brand-light">{v.name}</p>
                <CopyButton text={brief(v)} label="Copy brief" />
              </div>
              {has(v.headline) && <p className="mt-3 text-lg font-semibold leading-snug text-ink-primary">&ldquo;{v.headline}&rdquo;</p>}
              <dl className="mt-4 space-y-3">
                <div className="rounded-lg border border-brand/25 bg-brand/[0.06] p-3">
                  <Field label="Changed">{v.changes}</Field>
                </div>
                <Field label="Kept the same" muted>{v.keep}</Field>
                <Field label="Layout direction" muted>{v.layout}</Field>
                <Field label="Why" muted>{v.why}</Field>
                <Field label="Hypothesis" muted>{v.hypothesis}</Field>
              </dl>
            </div>
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-ink-muted">These are written briefs. No images are generated and no results are implied.</p>
    </ReportSection>
  );
}

/* ── 12 Audience ─────────────────────────────────────────────────────── */

function AudienceCard({ a, i, ctx }: { a: ReportCtx["view"]["audiences"][number]; i: number; ctx: ReportCtx }) {
  const d = useDisclosure(false);
  const more = a.objections.length > 0 || has(a.evidence);
  const text = [
    `${a.type} audience: ${a.name}`,
    a.overview,
    a.motivations.length && `Motivations: ${a.motivations.join("; ")}`,
    a.pain_points.length && `Pain points: ${a.pain_points.join("; ")}`,
    a.objections.length && `Objections: ${a.objections.join("; ")}`,
    a.awareness && `Awareness: ${a.awareness}`,
    a.messaging && `Messaging: ${a.messaging}`,
    a.angle && `Angle: ${a.angle}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <article className={`rp-card flex flex-col p-5 ${a.type === "Primary" ? "rp-card-first" : ""}`} data-rv style={{ ["--d" as string]: i }}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone={a.type === "Primary" ? "brand" : "neutral"}>{a.type} hypothesis</Tag>
        {has(a.awareness) && <Tag>{a.awareness.split(/[,.(]/)[0].trim()}</Tag>}
      </div>
      <h3 className="mt-3 text-base font-semibold text-ink-primary">{a.name}</h3>
      {has(a.overview) && <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{a.overview}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {a.motivations.length > 0 && (
          <div>
            <p className="rp-field-label">Motivations</p>
            <MiniList items={a.motivations} />
          </div>
        )}
        {a.pain_points.length > 0 && (
          <div>
            <p className="rp-field-label">Pain points</p>
            <MiniList items={a.pain_points} />
          </div>
        )}
      </div>
      {has(a.messaging, a.angle) && (
        <dl className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-4">
          <Field label="What to say">{a.messaging}</Field>
          <Field label="Best angle" muted>{a.angle}</Field>
        </dl>
      )}
      {more && (
        <>
          <ToggleRow open={d.open} onClick={d.toggle} controls={d.id} className="mt-4">
            {d.open ? "Less detail" : "Objections and evidence"}
          </ToggleRow>
          <Expandable open={d.open} id={d.id}>
            <div className="space-y-3 pt-3">
              {a.objections.length > 0 && (
                <div>
                  <p className="rp-field-label">Likely objections</p>
                  <MiniList items={a.objections} />
                </div>
              )}
              {has(a.awareness) && <Field label="Awareness level" muted>{a.awareness}</Field>}
              {has(a.evidence) && <Field label="Why we think so" muted>{a.evidence}</Field>}
            </div>
          </Expandable>
        </>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <CopyButton text={text} label="Copy hypothesis" />
        {ctx.view.hookIdeas.length > 0 && (
          <button type="button" className="rp-btn-ghost" onClick={() => ctx.goTo("rp-hooks")}>
            See hook ideas <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

export function AudienceSection({ ctx, index }: P) {
  return (
    <ReportSection
      id="rp-audience"
      index={index}
      title="Audience"
      kicker="AI-inferred from the creative. These are hypotheses to test, not targeting or customer data."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {ctx.view.audiences.map((a, i) => (
          <AudienceCard key={i} a={a} i={i} ctx={ctx} />
        ))}
      </div>
    </ReportSection>
  );
}

/* ── 13 Campaign ─────────────────────────────────────────────────────── */

export function CampaignSection({ ctx, index }: P) {
  const c = ctx.view.campaign;
  const cards = c
    ? [
        { label: "Objective", rec: c.objective.rec, why: c.objective.why },
        { label: "Optimization event", rec: c.optimization.rec, why: c.optimization.why },
        { label: "Placements", rec: c.placements.rec, why: c.placements.why },
      ].filter((x) => has(x.rec))
    : [];
  const t = c?.testing;

  return (
    <ReportSection
      id="rp-campaign"
      index={index}
      title="Campaign recommendations"
      kicker="General setup guidance for testing this creative. It is based on the creative only, since we don't know your business goal or account settings."
    >
      {cards.length > 0 || (t && has(t.test)) ? (
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((x, i) => (
            <div key={x.label} className="rp-card p-5" data-rv style={{ ["--d" as string]: i }}>
              <p className="rp-field-label">{x.label}</p>
              <p className="text-[15px] font-medium leading-snug text-ink-primary">{x.rec}</p>
              {has(x.why) && <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{x.why}</p>}
            </div>
          ))}
          {t && has(t.test) && (
            <div className="rp-card p-5 md:col-span-2" data-rv>
              <p className="rp-field-label">Testing approach</p>
              <p className="text-[15px] font-medium leading-snug text-ink-primary">{t.test}</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Keep constant" muted>{t.keep}</Field>
                <Field label="Measure" muted>{t.measure}</Field>
                <Field label="Supporting result" muted>{t.evidence}</Field>
              </dl>
            </div>
          )}
        </div>
      ) : (
        <p className="rp-card p-5 text-sm text-ink-secondary">No campaign guidance was produced for this report.</p>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between" data-rv>
        <div>
          <p className="text-sm font-medium text-ink-primary">Campaign performance</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
            This report contains no CTR, ROAS, spend or conversion data. Performance numbers only come from a connected ad account.
          </p>
        </div>
        {ctx.context === "app" &&
          (ctx.adAccountConnected ? (
            <Link href="/insights" className="rp-btn-ghost shrink-0">
              Open account insights <ArrowRight size={14} aria-hidden />
            </Link>
          ) : ctx.adAccountConnected === false ? (
            <Link href="/accounts" className="rp-btn-ghost shrink-0">
              Connect an ad account <ArrowRight size={14} aria-hidden />
            </Link>
          ) : null)}
      </div>
    </ReportSection>
  );
}

/* ── 14 Testing plan ─────────────────────────────────────────────────── */

export function TestingSection({ ctx, index }: P) {
  const { view } = ctx;
  const all = view.tests
    .map((t) =>
      [
        t.name,
        t.variable_isolated && `Variable: ${t.variable_isolated}`,
        t.hypothesis && `Hypothesis: ${t.hypothesis}`,
        t.change && `Change: ${t.change}`,
        t.keep && `Keep constant: ${t.keep}`,
        t.primary_metric && `Primary metric: ${t.primary_metric}`,
        t.secondary_metrics && `Secondary: ${t.secondary_metrics}`,
        t.interpret && `Reading the result: ${t.interpret}`,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  return (
    <ReportSection
      id="rp-testing"
      index={index}
      title="Testing plan"
      kicker="One variable per test, measured against the original. Each is a hypothesis, not a promised lift."
      aside={<CopyButton text={all} label="Copy plan" />}
    >
      <ol className="rp-timeline space-y-3">
        {view.tests.map((t, i) => (
          <li key={i} className="relative pl-10 sm:pl-12" data-rv style={{ ["--d" as string]: i }}>
            <span className="absolute left-0 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-brand/40 bg-base-bg text-xs font-semibold text-brand-light sm:h-8 sm:w-8">
              {String.fromCharCode(65 + i)}
            </span>
            <article className="rp-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-ink-primary">{t.name}</h3>
                {has(t.variable_isolated) && <Tag tone="brand">Variable: {t.variable_isolated}</Tag>}
              </div>
              {has(t.hypothesis) && <p className="mt-2 text-sm leading-relaxed text-ink-primary/90">{t.hypothesis}</p>}
              {has(t.change, t.keep, t.primary_metric, t.secondary_metrics, t.interpret) && (
                <dl className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
                  <Field label="Original">{has(t.change) ? "Current creative, unchanged" : ""}</Field>
                  <Field label="Variation">{t.change}</Field>
                  <Field label="Keep constant" muted>{t.keep}</Field>
                  <Field label="Primary metric" muted>{t.primary_metric}</Field>
                  <Field label="Secondary metrics" muted>{t.secondary_metrics}</Field>
                  <Field label="How to read it" muted>{t.interpret}</Field>
                </dl>
              )}
            </article>
          </li>
        ))}
      </ol>
    </ReportSection>
  );
}

/* ── 15 Readiness ────────────────────────────────────────────────────── */

export function ReadinessSection({ ctx, index }: P) {
  const { view } = ctx;
  const r = view.campaign?.readiness;
  const status = r?.status || view.campaignReadiness;
  return (
    <ReportSection id="rp-readiness" index={index} title="Creative readiness" kicker="Whether to put this creative in front of an audience now.">
      <div className="rp-card grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" data-rv>
        <div>
          <p className="rp-field-label">Readiness score</p>
          <p className="text-4xl font-semibold tracking-tight text-ink-primary tabular-nums">
            {view.readinessScore}
            <span className="text-base font-normal text-ink-muted">/100</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <span className="rp-bar block h-full rounded-full" style={{ width: `${view.readinessScore}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="brand">{FINAL_VERDICT_TEXT[view.finalVerdict]}</Tag>
            {has(status) && <Tag>{status}</Tag>}
          </div>
        </div>
        <div className="space-y-4">
          {has(view.finalReason) && <p className="text-[15px] leading-relaxed text-ink-primary">{view.finalReason}</p>}
          {r && r.reasons.length > 0 && (
            <div>
              <p className="rp-field-label">Reasons</p>
              <MiniList items={r.reasons} />
            </div>
          )}
        </div>
      </div>
    </ReportSection>
  );
}

/* ── 16 Next steps ───────────────────────────────────────────────────── */

export function NextStepsSection({ ctx, index }: P) {
  const { view } = ctx;
  const steps: { title: string; body: string; go?: [string, string?] }[] = [];
  const f = view.fixes[0];
  if (f) steps.push({ title: "Make the top fix", body: f.fix || f.issue, go: ["rp-improve", "rp-improve-0"] });
  const v = view.variations[0];
  if (v) steps.push({ title: `Brief ${v.name}`, body: v.changes || (v.headline ? `New headline: "${v.headline}"` : ""), go: ["rp-variations"] });
  const t = view.tests[0];
  if (t) steps.push({ title: `Run ${t.name.split(":")[0]}`, body: t.hypothesis || t.name, go: ["rp-testing"] });
  if (steps.length < 3 && view.hookIdeas[0]) steps.push({ title: "Test a new hook", body: `"${view.hookIdeas[0].hook}"`, go: ["rp-hooks"] });

  const everything = [
    `Creative score: ${view.score}/100 (${FINAL_VERDICT_TEXT[view.finalVerdict]})`,
    view.verdictText,
    "",
    "Fixes, in order:",
    ...view.fixes.map((x, i) => `${i + 1}. ${x.fix || x.issue}${x.example ? ` Example: ${x.example}` : ""}`),
    ...(view.hookIdeas.length ? ["", "Hooks to test:", ...view.hookIdeas.map((h) => `- ${h.hook}`)] : []),
    ...(view.tests.length ? ["", "Tests:", ...view.tests.map((x) => `- ${x.name}${x.hypothesis ? `: ${x.hypothesis}` : ""}`)] : []),
  ].join("\n");

  return (
    <ReportSection id="rp-next" index={index} title="Your next steps">
      <div className="rp-next overflow-hidden rounded-2xl p-5 sm:p-7" data-rv>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.slice(0, 3).map((s, i) => (
            <li key={i} className="flex flex-col">
              <span className="text-3xl font-semibold tabular-nums text-brand-light/70">{i + 1}</span>
              <p className="mt-2 text-sm font-semibold text-ink-primary">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{s.body}</p>
              {s.go && (
                <button
                  type="button"
                  onClick={() => ctx.goTo(s.go![0], s.go![1])}
                  className="mt-2 w-fit text-xs font-medium text-brand-light underline-offset-4 hover:underline"
                >
                  Go to section →
                </button>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.08] pt-5 sm:flex-row sm:flex-wrap">
          <CopyButton text={everything} label="Copy recommendations" className="justify-center" />
          {ctx.context === "app" && ctx.onReanalyze && (
            <button
              type="button"
              onClick={ctx.onReanalyze}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light"
            >
              Analyze the updated version <ArrowRight size={14} aria-hidden />
            </button>
          )}
          {ctx.context === "app" && !ctx.onReanalyze && (
            <Link
              href="/analyze"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light"
            >
              Analyze the updated version <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </ReportSection>
  );
}
