"use client";

/* eslint-disable @next/next/no-img-element -- user uploads and blob: previews */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  Eye,
  EyeOff,
  Maximize2,
  ScanSearch,
} from "lucide-react";
import type { CreativeReport } from "@/lib/analyzeCreative";
import { toReportView, type ReportView } from "@/lib/reportView";
import { ScoreGauge, scoreColor } from "@/components/report/ScoreGauge";
import {
  ANN_TONE,
  CreativeCanvas,
  Lightbox,
} from "@/components/report/AnnotatedCreative";
import { ReportSection, Tag, has } from "@/components/report/primitives";
import {
  AnglesSection,
  AudienceSection,
  CampaignSection,
  FixesSection,
  HooksSection,
  ImproveFirstSection,
  NextStepsSection,
  ReadinessSection,
  SignalsSection,
  StrengthsSection,
  SummarySection,
  TestingSection,
  VariationsSection,
  WhyScoreSection,
  VideoSection,
} from "@/components/report/sections";

export const FINAL_VERDICT_TEXT: Record<
  CreativeReport["final_recommendation"]["verdict"],
  string
> = {
  YES: "Ready to launch",
  "YES — WITH CHANGES": "Launch after changes",
  "TEST FIRST": "Test before scaling",
  "NO — REWORK REQUIRED": "Rework before launch",
};
const FINAL_VERDICT_TONE = {
  YES: "green",
  "YES — WITH CHANGES": "brand",
  "TEST FIRST": "amber",
  "NO — REWORK REQUIRED": "red",
} as const;

export function interpretScore(score: number) {
  if (score >= 90) return "Excellent creative";
  if (score >= 80) return "Strong creative";
  if (score >= 60) return "Promising, needs work";
  if (score >= 40) return "Needs improvement";
  return "Rework needed";
}

export type ReportContext = "app" | "public";

/** Shared between sections: which annotation is highlighted, and scrolling helpers. */
export type ReportCtx = {
  view: ReportView;
  imageUrl: string | null;
  context: ReportContext;
  reportId?: string;
  adAccountConnected?: boolean;
  onReanalyze?: () => void;
  activeAnn: string | null;
  setActiveAnn: (id: string | null) => void;
  /** Highlights an annotation and brings the breakdown into view. */
  inspect: (annId: string) => void;
  goTo: (sectionId: string, focusId?: string) => void;
  annIndex: (annId?: string | null) => number;
};

type NavItem = { id: string; label: string };

export function ReportExperience({
  report,
  imageUrl = null,
  isSimulated = false,
  upgrade = null,
  reportId,
  context = "app",
  adAccountConnected,
  onReanalyze,
}: {
  report: CreativeReport;
  imageUrl?: string | null;
  isSimulated?: boolean;
  upgrade?: React.ReactNode;
  reportId?: string;
  context?: ReportContext;
  adAccountConnected?: boolean;
  /** On the Analyze page: resets the uploader instead of linking to /analyze. */
  onReanalyze?: () => void;
}) {
  const view = useMemo(() => toReportView(report), [report]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeAnn, setActiveAnn] = useState<string | null>(null);
  const [showAnn, setShowAnn] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [ratio, setRatio] = useState(1);
  const [imgOk, setImgOk] = useState(true);

  const isVideo = !!view.video;
  const image = imageUrl && imgOk && !isVideo ? imageUrl : null;
  const videoSrc = isVideo && imageUrl && imgOk ? imageUrl : null;
  const hasBreakdown = !!image && view.annotations.length > 0;

  const nav: NavItem[] = useMemo(() => {
    const items: (NavItem | false)[] = [
      { id: "rp-overview", label: "Overview" },
      hasBreakdown && { id: "rp-breakdown", label: "Breakdown" },
      { id: "rp-summary", label: "Summary" },
      isVideo && { id: "rp-video", label: "Video" },
      view.strengths.length > 0 && {
        id: "rp-strengths",
        label: "What's great",
      },
      view.fixes.length > 0 && { id: "rp-fixes", label: "Priority fixes" },
      view.signals.length > 0 && { id: "rp-signals", label: "Signals" },
      { id: "rp-why", label: "Why this score" },
      view.fixes.length > 0 && { id: "rp-improve", label: "Improve first" },
      { id: "rp-hooks", label: "Hooks" },
      (view.angles.length > 0 || view.improvements.length > 0) && {
        id: "rp-angles",
        label: "Angles",
      },
      view.variations.length > 0 && {
        id: "rp-variations",
        label: "Variations",
      },
      view.audiences.length > 0 && { id: "rp-audience", label: "Audience" },
      { id: "rp-campaign", label: "Campaign" },
      view.tests.length > 0 && { id: "rp-testing", label: "Testing plan" },
      { id: "rp-readiness", label: "Readiness" },
      { id: "rp-next", label: "Next steps" },
    ];
    return items.filter(Boolean) as NavItem[];
  }, [view, hasBreakdown, isVideo]);
  const num = (id: string) => nav.findIndex((n) => n.id === id) + 1;

  /* ── reveal-once motion ─────────────────────────────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-rv]"));
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add("rv-in");
    });
    root.classList.add("rp-ready");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("rv-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    els.forEach((el) => !el.classList.contains("rv-in") && io.observe(el));
    // Elements that mount later (expanded content, re-rendered cards) are
    // observed too, so nothing can stay invisible after the first pass.
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          const found = [n, ...Array.from(n.querySelectorAll<HTMLElement>("[data-rv]"))].filter((el) => el.hasAttribute("data-rv") && !el.classList.contains("rv-in"));
          found.forEach((el) => io.observe(el));
        });
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [view]);

  /* ── navigation ─────────────────────────────────────────────────────── */
  const goTo = useCallback((sectionId: string, focusId?: string) => {
    const target =
      document.getElementById(focusId ?? sectionId) ??
      document.getElementById(sectionId);
    if (!target) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    target.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: focusId ? "center" : "start",
    });
    if (focusId) {
      target.classList.remove("rp-flash");
      void target.offsetWidth; // restart the highlight
      target.classList.add("rp-flash");
    }
  }, []);

  const inspect = useCallback(
    (annId: string) => {
      setShowAnn(true);
      setActiveAnn(annId);
      goTo("rp-breakdown");
    },
    [goTo],
  );

  const annIndex = useCallback(
    (id?: string | null) =>
      id ? view.annotations.findIndex((a) => a.id === id) : -1,
    [view],
  );

  const ctx: ReportCtx = {
    view,
    imageUrl: image,
    context,
    reportId,
    adAccountConnected,
    onReanalyze,
    activeAnn,
    setActiveAnn,
    inspect: hasBreakdown ? inspect : () => undefined,
    goTo,
    annIndex: hasBreakdown ? annIndex : () => -1,
  };

  const finalTone = FINAL_VERDICT_TONE[view.finalVerdict] ?? "neutral";

  return (
    <>
      <div
        ref={rootRef}
        className="rp-root"
        style={{
          ["--rp-top" as string]: context === "public" ? "64px" : "0px",
        }}
      >
        {isSimulated && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-sm text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <p>
              This is a simulated sample, not an analysis of your creative. No
              credits were used. Run the analysis again once the AI service is
              available.
            </p>
          </div>
        )}

        {/* ── 01 OVERVIEW ──────────────────────────────────────────────── */}
        <section
          id="rp-overview"
          data-report-section
          aria-label="Report overview"
          className="rp-overview"
        >
          <div className="rp-glow" aria-hidden />
          <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8 lg:p-8">
            {/* creative preview */}
            <div className="rp-enter" style={{ ["--d" as string]: 0 }}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {image && (
                  <button
                    type="button"
                    onClick={() => setZoom(true)}
                    className="rp-btn-ghost order-last ml-auto h-8"
                  >
                    <Maximize2 size={13} aria-hidden /> Enlarge
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-green/25 bg-accent-green/10 px-2 py-0.5 text-[11px] font-medium text-accent-green">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent-green"
                    aria-hidden
                  />
                  {isSimulated ? "Sample" : "Analyzed"}
                </span>
                {has(view.format) && <Tag>{view.format}</Tag>}
                {has(view.placement) && <Tag>{view.placement}</Tag>}
              </div>
              {videoSrc ? (
                <video
                  src={videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                  className="mx-auto block max-h-[520px] w-full max-w-[420px] rounded-xl border border-white/[0.08] bg-black/40 object-contain lg:max-w-none"
                  onError={() => setImgOk(false)}
                />
              ) : image ? (
                <button
                  type="button"
                  onClick={() => setZoom(true)}
                  aria-label="Enlarge creative"
                  className="group relative mx-auto block w-full max-w-[420px] cursor-zoom-in overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 lg:max-w-none"
                >
                  <img
                    src={image}
                    alt="Your uploaded creative"
                    className="mx-auto block max-h-[520px] w-auto max-w-full object-contain"
                    onError={() => setImgOk(false)}
                    onLoad={(e) => {
                      const im = e.currentTarget;
                      if (im.naturalWidth && im.naturalHeight)
                        setRatio(im.naturalWidth / im.naturalHeight);
                    }}
                  />
                </button>
              ) : (
                <div className="flex aspect-[4/5] max-h-[420px] w-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-ink-muted">
                  Preview unavailable
                </div>
              )}
              {hasBreakdown && (
                <button
                  type="button"
                  onClick={() => goTo("rp-breakdown")}
                  className="rp-btn-ghost mt-3 w-full justify-center"
                >
                  <ScanSearch size={14} aria-hidden /> Open annotated breakdown
                  ({view.annotations.length} markers)
                </button>
              )}
            </div>

            {/* score + verdict */}
            <div className="flex min-w-0 flex-col">
              <div
                className="flex flex-col items-center gap-5 sm:flex-row sm:items-center rp-enter"
                style={{ ["--d" as string]: 1 }}
              >
                <ScoreGauge score={view.score} />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
                    Creative score
                  </p>
                  <p
                    className="mt-1 text-xl font-semibold tracking-tight"
                    style={{ color: scoreColor(view.score) }}
                  >
                    {interpretScore(view.score)}
                  </p>
                  <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    <Tag tone={finalTone}>
                      {FINAL_VERDICT_TEXT[view.finalVerdict]}
                    </Tag>
                    {has(view.campaignReadiness) && (
                      <Tag>{view.campaignReadiness}</Tag>
                    )}
                  </div>
                </div>
              </div>

              {has(view.verdictText) && (
                <p
                  className="rp-enter mt-6 text-[17px] leading-relaxed text-ink-primary sm:text-lg"
                  style={{ ["--d" as string]: 2 }}
                >
                  {view.verdictText}
                </p>
              )}

              <dl
                className="rp-enter mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2"
                style={{ ["--d" as string]: 3 }}
              >
                <div className="bg-base-card p-4">
                  <dt className="rp-field-label text-accent-green">
                    Main strength
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink-primary/90">
                    {view.summary.strongest ||
                      view.strengths[0]?.title ||
                      "Not stated"}
                  </dd>
                </div>
                <div className="bg-base-card p-4">
                  <dt className="rp-field-label text-[#F87171]">
                    Main weakness
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink-primary/90">
                    {view.summary.weakest ||
                      view.fixes[0]?.issue ||
                      "Not stated"}
                  </dd>
                </div>
              </dl>

              {has(view.priorityAction) && (
                <div
                  className="rp-enter rp-priority mt-4 rounded-xl p-4"
                  style={{ ["--d" as string]: 4 }}
                >
                  <p className="rp-field-label text-brand-light">
                    Do this first
                  </p>
                  <p className="text-[15px] font-medium leading-relaxed text-ink-primary">
                    {view.priorityAction}
                  </p>
                  {view.fixes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => goTo("rp-improve", "rp-improve-0")}
                      className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light"
                    >
                      View priority fix <ArrowDown size={14} aria-hidden />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── sticky section navigation ───────────────────────────────── */}
        <SectionNav items={nav} />

        <div className="space-y-14 pt-6 sm:space-y-16">
          {/* ── 02 BREAKDOWN ─────────────────────────────────────────── */}
          {hasBreakdown && image && (
            <ReportSection
              id="rp-breakdown"
              index={num("rp-breakdown")}
              title="Creative breakdown"
              kicker="Each marker points to an element the analysis comments on. Hover or tap a marker, or pick an item from the list."
              aside={
                <button
                  type="button"
                  onClick={() => setShowAnn((s) => !s)}
                  className="rp-btn-ghost"
                  aria-pressed={!showAnn}
                >
                  {showAnn ? (
                    <EyeOff size={14} aria-hidden />
                  ) : (
                    <Eye size={14} aria-hidden />
                  )}
                  {showAnn ? "Hide markers" : "Show markers"}
                </button>
              }
            >
              <Breakdown
                ctx={ctx}
                image={image}
                showAnn={showAnn}
                onZoom={() => setZoom(true)}
                onRatio={setRatio}
              />
            </ReportSection>
          )}

          <SummarySection ctx={ctx} index={num("rp-summary")} />
          {isVideo && <VideoSection ctx={ctx} index={num("rp-video")} />}
          {view.strengths.length > 0 && (
            <StrengthsSection ctx={ctx} index={num("rp-strengths")} />
          )}
          {view.fixes.length > 0 && (
            <FixesSection ctx={ctx} index={num("rp-fixes")} />
          )}
          {view.signals.length > 0 && (
            <SignalsSection ctx={ctx} index={num("rp-signals")} />
          )}
          <WhyScoreSection ctx={ctx} index={num("rp-why")} />
          {view.fixes.length > 0 && (
            <ImproveFirstSection ctx={ctx} index={num("rp-improve")} />
          )}
          <HooksSection ctx={ctx} index={num("rp-hooks")} />
          {(view.angles.length > 0 || view.improvements.length > 0) && (
            <AnglesSection ctx={ctx} index={num("rp-angles")} />
          )}
          {view.variations.length > 0 && (
            <VariationsSection ctx={ctx} index={num("rp-variations")} />
          )}
          {view.audiences.length > 0 && (
            <AudienceSection ctx={ctx} index={num("rp-audience")} />
          )}
          <CampaignSection ctx={ctx} index={num("rp-campaign")} />
          {view.tests.length > 0 && (
            <TestingSection ctx={ctx} index={num("rp-testing")} />
          )}
          <ReadinessSection ctx={ctx} index={num("rp-readiness")} />
          <NextStepsSection ctx={ctx} index={num("rp-next")} />
        </div>

        {image && (
          <Lightbox
            open={zoom}
            onClose={() => setZoom(false)}
            title="Creative preview"
            ratio={ratio}
          >
            <CreativeCanvas
              src={image}
              alt="Your uploaded creative, enlarged"
              annotations={view.annotations}
              show={showAnn && hasBreakdown}
              active={activeAnn}
              onActivate={setActiveAnn}
              large
            />
          </Lightbox>
        )}
      </div>
      {/* Outside the report root so the sticky section nav stops before it. */}
      {upgrade && <div className="mt-14">{upgrade}</div>}
    </>
  );
}

/* ── Section navigation ──────────────────────────────────────────────── */

function SectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        });
        if (visible.size) {
          const first = items.find((it) => visible.has(it.id));
          if (first) setActive(first.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  // Keep the active pill visible in the horizontal strip (without moving the page).
  useEffect(() => {
    const list = listRef.current;
    const pill = list?.querySelector<HTMLElement>(`[data-nav="${active}"]`);
    if (!list || !pill) return;
    const left = pill.offsetLeft - list.clientWidth / 2 + pill.clientWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    setActive(id);
  }

  return (
    <nav aria-label="Report sections" className="rp-nav">
      <div ref={listRef} className="rp-nav-list">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            data-nav={it.id}
            onClick={() => jump(it.id)}
            aria-current={active === it.id ? "true" : undefined}
            className="rp-nav-pill"
          >
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── Interactive breakdown ───────────────────────────────────────────── */

function Breakdown({
  ctx,
  image,
  showAnn,
  onZoom,
  onRatio,
}: {
  ctx: ReportCtx;
  image: string;
  showAnn: boolean;
  onZoom: () => void;
  onRatio: (r: number) => void;
}) {
  const { view, activeAnn, setActiveAnn, goTo } = ctx;
  const active = view.annotations.find((a) => a.id === activeAnn) ?? null;

  // What the report recommends for a given marker (if a fix or strength points to it).
  const linked = (id: string) => {
    const fi = view.fixes.findIndex((f) => f.annotation === id);
    if (fi >= 0)
      return {
        kind: "fix" as const,
        i: fi,
        text: view.fixes[fi].fix,
        title: view.fixes[fi].issue,
      };
    const si = view.strengths.findIndex((s) => s.annotation === id);
    if (si >= 0)
      return {
        kind: "strength" as const,
        i: si,
        text: view.strengths[si].keep,
        title: view.strengths[si].title,
      };
    return null;
  };

  const insight = (a: (typeof view.annotations)[number], i: number) => {
    const l = linked(a.id);
    const t = ANN_TONE[a.tone];
    return (
      <>
        <p className="flex items-center gap-2 text-xs font-medium">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${t.dot}`}
          >
            {i + 1}
          </span>
          <span className="text-ink-primary">{a.label}</span>
          <span className={t.text}>· {t.name}</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-primary/90">
          {a.note}
        </p>
        {l && has(l.text) && (
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <p className="rp-field-label">
              {l.kind === "fix" ? "Recommended change" : "Keep in new versions"}
            </p>
            <p className="text-sm leading-relaxed text-ink-secondary">
              {l.text}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(
                  l.kind === "fix" ? "rp-fixes" : "rp-strengths",
                  `rp-${l.kind}-${l.i}`,
                );
              }}
              className="mt-2 text-xs font-medium text-brand-light underline-offset-4 hover:underline"
            >
              Read the full {l.kind === "fix" ? "fix" : "note"} →
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-[calc(var(--rp-top)+84px)]" data-rv>
        <div
          className="relative mx-auto max-w-[460px] overflow-hidden rounded-xl border border-white/[0.08] bg-black/40"
          onPointerLeave={(e) =>
            e.pointerType === "mouse" && setActiveAnn(null)
          }
        >
          <CreativeCanvas
            src={image}
            alt="Your creative with numbered analysis markers"
            annotations={view.annotations}
            show={showAnn}
            active={activeAnn}
            onActivate={setActiveAnn}
            onRatio={onRatio}
          />
          <button
            type="button"
            onClick={onZoom}
            className="absolute bottom-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-white backdrop-blur hover:bg-black/80"
            aria-label="Enlarge annotated creative"
          >
            <Maximize2 size={12} aria-hidden />
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-[460px] text-[11px] leading-relaxed text-ink-muted">
          Marker positions are approximate. They show where the analysis looked,
          not pixel-exact detection.
        </p>
        {/* The selected marker's insight, right under the image (the list can be far below on phones). */}
        {active && showAnn && (
          <div
            key={active.id}
            className="rp-pop mx-auto mt-3 max-w-[460px] rounded-xl border border-brand/30 bg-base-surface p-4"
            aria-live="polite"
          >
            {insight(active, view.annotations.indexOf(active))}
          </div>
        )}
      </div>

      <ol className="space-y-2.5">
        {view.annotations.map((a, i) => {
          const isActive = activeAnn === a.id;
          return (
            <li key={a.id} data-rv style={{ ["--d" as string]: i }}>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onPointerEnter={(e) =>
                  e.pointerType === "mouse" && setActiveAnn(a.id)
                }
                onFocus={(e) =>
                  e.currentTarget.matches(":focus-visible") &&
                  setActiveAnn(a.id)
                }
                onClick={(e) => {
                  const mouse =
                    (e.nativeEvent as PointerEvent).pointerType === "mouse";
                  setActiveAnn(isActive && !mouse ? null : a.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveAnn(isActive ? null : a.id);
                  }
                }}
                className={`rp-card rp-ann-item cursor-pointer p-4 ${isActive ? "rp-ann-active" : ""}`}
              >
                {insight(a, i)}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
