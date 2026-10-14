"use client";

import { useEffect, useRef } from "react";
import { Check, Sparkles } from "lucide-react";
import { AdMock } from "@/components/marketing/strategy/AdMock";
import { AnalyzeButton, ConceptCard, IllustrationTag, SnapshotRow, UrlField } from "@/components/marketing/strategy/Mocks";
import { AD_VARIANTS, CONCEPTS, DEMO_BRAND, PROGRESS_STEPS, SELECTED_CONCEPT, SNAPSHOT, SUGGESTED_COPY } from "@/lib/strategyShowcase";

// ─────────────────────────────────────────────────────────────────────────────
// "From your brand to your next ad." — Creative Strategy showcase (homepage).
//
// Three connected panels: brand input → strategy → creative output. Same motion
// model as How It Works (one passive scroll listener → rAF → --sp on each panel,
// smoothed, reversible). Side by side, the panels light up in order; stacked on
// mobile, each follows its own position. Reduced motion shows everything.
// All content is an illustration with a fictional brand (lib/strategyShowcase).
// ─────────────────────────────────────────────────────────────────────────────

const SMOOTHING_MS = 110;

function PanelHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-light/85">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-[10px] text-brand-light">{n}</span>
        {title}
      </p>
      <span className="flex gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/[0.07]" />
      </span>
    </div>
  );
}

/** Connector into a panel from the previous one (horizontal on wide screens, vertical when stacked). */
function Link() {
  return (
    <>
      <span aria-hidden className="ss-link pointer-events-none absolute -left-10 top-[118px] hidden h-px w-10 lg:block">
        <span className="ss-link-fill absolute inset-0 bg-gradient-to-r from-brand/30 to-brand-light shadow-[0_0_10px_rgba(139,92,246,0.7)]" />
      </span>
      <span aria-hidden className="ss-link ss-link-v pointer-events-none absolute -top-7 left-1/2 h-7 w-px lg:hidden">
        <span className="ss-link-fill absolute inset-0 bg-gradient-to-b from-brand/30 to-brand-light shadow-[0_0_10px_rgba(139,92,246,0.7)]" />
      </span>
    </>
  );
}

export function StrategyShowcase() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>(".ss-panel"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target: number[] = panels.map(() => 0);
    const shown: number[] = panels.map(() => (reduced ? 1 : 0));

    const read = () => {
      const vh = window.innerHeight;
      const tops = panels.map((p) => p.getBoundingClientRect().top);
      const inRow = panels.length > 1 && Math.abs(tops[1] - tops[0]) < 120;
      if (inRow) {
        // one shared progress across the row, handed from panel to panel
        const raw = (vh * 0.86 - stage.getBoundingClientRect().top) / (vh * 0.62);
        panels.forEach((_, i) => (target[i] = reduced ? 1 : Math.min(1, Math.max(0, (raw - i * 0.27) / 0.46))));
      } else {
        panels.forEach((_, i) => (target[i] = reduced ? 1 : Math.min(1, Math.max(0, (vh * 0.92 - tops[i]) / (vh * 0.55)))));
      }
    };
    const write = () => panels.forEach((p, i) => p.style.setProperty("--sp", shown[i].toFixed(4)));

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      read();
      const k = reduced ? 1 : 1 - Math.exp(-dt / SMOOTHING_MS);
      let moving = false;
      shown.forEach((v, i) => {
        const d = target[i] - v;
        if (Math.abs(d) > 0.0008) {
          shown[i] = v + d * k;
          moving = true;
        } else shown[i] = target[i];
      });
      write();
      raf = moving ? requestAnimationFrame(frame) : 0;
      if (!moving) last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    read();
    if (reduced) panels.forEach((_, i) => (shown[i] = 1));
    write();
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, []);

  const concept = CONCEPTS[SELECTED_CONCEPT];

  return (
    <section id="creative-strategy" aria-labelledby="ss-title" className="relative scroll-mt-24 overflow-hidden border-t border-white/5 px-5 py-24 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-[560px] w-[1000px] max-w-[170vw] -translate-x-1/2 rounded-full opacity-80 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.12), transparent 75%)" }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <p data-reveal className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-light">
          <Sparkles size={12} aria-hidden /> New · Creative Strategy
        </p>
        <h2 id="ss-title" data-reveal style={{ ["--d" as string]: 1 }} className="mt-5 text-balance text-3xl font-semibold tracking-tight text-ink-primary sm:text-[44px] sm:leading-[1.1]">
          From your brand to your next ad.
        </h2>
        <p data-reveal style={{ ["--d" as string]: 2 }} className="mx-auto mt-4 max-w-xl text-pretty text-ink-secondary">
          Start with what makes your business different. Get a tailored creative strategy, then turn the best ideas into ready-to-review ad concepts.
        </p>
      </div>

      <div ref={stageRef} className="relative mx-auto mt-14 max-w-6xl sm:mt-16">
        <div className="ss-grid grid grid-cols-1 gap-7 lg:gap-10">
          {/* 1 — brand input */}
          <div className="ss-panel">
            <div className="ss-window">
              <PanelHead n={1} title="Your brand" />
              <div className="p-4">
                <UrlField kind="web" label="Website URL" value={DEMO_BRAND.website} valueClassName="ss-type" />
                <UrlField kind="social" label="Social media profile URL" value={DEMO_BRAND.social} valueClassName="ss-type" className="mt-3 [--i:1]" />
                <div className="ss-item mt-4 [--i:2]">
                  <AnalyzeButton className="w-full" />
                </div>
                <ul className="mt-4 space-y-2">
                  {PROGRESS_STEPS.map((t, i) => (
                    <li key={t} className="ss-item flex items-center gap-2 text-[0.85em] text-ink-primary" style={{ ["--i" as string]: 3 + i }}>
                      <span className="flex h-[1.25em] w-[1.25em] shrink-0 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="h-[0.75em] w-[0.75em]" strokeWidth={3} aria-hidden />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="ss-item mt-4 text-[0.75em] leading-relaxed text-ink-muted [--i:7]">
                  Public information only. Private profile? Paste its bio or add screenshots instead.
                </p>
              </div>
            </div>
          </div>

          {/* 2 — strategy */}
          <div className="ss-panel">
            <Link />
            <div className="ss-window">
              <PanelHead n={2} title="Your strategy" />
              <div className="p-4">
                <div className="ss-item flex items-center justify-between gap-2">
                  <p className="text-[0.95em] font-semibold text-ink-primary">{DEMO_BRAND.name}</p>
                  <IllustrationTag />
                </div>
                <div className="mt-3 space-y-1.5">
                  {SNAPSHOT.slice(0, 3).map((r, i) => (
                    <SnapshotRow key={r.label} {...r} className="ss-item" style={{ ["--i" as string]: 1 + i }} />
                  ))}
                </div>
                <p className="ss-item mt-4 text-[0.72em] font-semibold uppercase tracking-[0.12em] text-ink-muted [--i:4]">Recommended ad concepts</p>
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                  {CONCEPTS.map((c, i) => (
                    <ConceptCard key={c.name} {...c} selected={i === SELECTED_CONCEPT} className="ss-item" style={{ ["--i" as string]: 5 + i }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3 — creative output */}
          <div className="ss-panel">
            <Link />
            <div className="ss-window">
              <PanelHead n={3} title="Your ads" />
              <div className="p-4">
                <div className="ss-item flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-brand/50 bg-brand/[0.15] px-2.5 py-0.5 text-[0.75em] font-medium text-brand-light">
                    {concept.angle} · {concept.name}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,0.72fr)] items-end gap-2.5">
                  {AD_VARIANTS.map((v, i) => (
                    <figure key={v.ratio} className="ss-item" style={{ ["--i" as string]: 1 + i }}>
                      <div className="relative overflow-hidden rounded-lg border border-white/10 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.9)]" style={{ ["--i" as string]: i }}>
                        <AdMock ratio={v.ratio} lines={v.lines} cta={v.cta} />
                        <span className="ss-skel" aria-hidden />
                      </div>
                      <figcaption className="mt-1 text-center text-[0.7em] text-ink-muted">{v.ratio}</figcaption>
                    </figure>
                  ))}
                </div>
                <dl className="mt-3 space-y-1.5">
                  {[
                    ["Headline", SUGGESTED_COPY.headline],
                    ["Primary text", SUGGESTED_COPY.primary],
                  ].map(([k, v], i) => (
                    <div key={k} className="ss-item rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2" style={{ ["--i" as string]: 5 + i }}>
                      <dt className="text-[0.72em] uppercase tracking-[0.06em] text-ink-muted">{k}</dt>
                      <dd className="mt-0.5 text-[0.85em] text-ink-primary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
