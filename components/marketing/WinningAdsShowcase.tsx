"use client";

import { useEffect, useLayoutEffect as useReactLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, FlaskConical, Search } from "lucide-react";
import { SHOWCASE_CTA, type ShowcaseCreative } from "@/lib/showcase";

const useLayoutEffect = typeof window === "undefined" ? useEffect : useReactLayoutEffect;

// ─── Motion ──────────────────────────────────────────────────────────────────
// Every distance is a multiple of the card width (w), and the CSS sizes are all
// derived from --ws-w, so the scene is the SAME composition at every screen
// size — mobile is simply the desktop scene, smaller.
const SPEED = 0.2;    // card widths per second — slow enough to read each ad
const SPACING = 1.17; // card pitch, in card widths (leaves a clean gap)
const MAX_TILT = 32;  // deg of rotateY at the stage edge
const DEPTH = 0.8;    // how far (in w) the edge cards curve toward the camera

/**
 * Transform for a card `x` px from the stage centre. Concave ring like the
 * reference: the centre card sits deepest, outer cards come forward, grow and
 * turn to face the middle.
 */
function cardTransform(x: number, halfStage: number, w: number, depth = DEPTH, tilt = MAX_TILT) {
  const t = Math.max(-1.7, Math.min(1.7, x / Math.max(halfStage, 1)));
  const a = Math.abs(t);
  return {
    transform: `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${(a * a * depth * w).toFixed(2)}px) rotateY(${(-t * tilt).toFixed(3)}deg)`,
    zIndex: String(10 + Math.round(a * 40)),
    highlight: Math.max(0, 1 - a * 3).toFixed(3), // soft glow under the centre card
  };
}

/** Wrap i·spacing − offset into [−total/2, total/2) → a seamless, endless loop. */
function wrappedX(i: number, spacing: number, total: number, offset: number) {
  let x = (i * spacing - offset) % total;
  if (x < -total / 2) x += total;
  if (x >= total / 2) x -= total;
  return x;
}

const BENEFITS = [
  { icon: Eye, title: "Spot what’s working.", body: "Understand the hook, visual hierarchy, offer, messaging, and call to action.", short: "Understand the hook, visuals, offer, and messaging." },
  { icon: Search, title: "Find what holds it back.", body: "Identify potential weaknesses and uncover specific elements worth testing.", short: "Identify weaknesses worth improving." },
  { icon: FlaskConical, title: "Know what to test next.", body: "Explore alternative approaches and turn creative observations into actionable testing hypotheses.", short: "Discover ideas for your next creative test." },
];

/**
 * "Know what makes an ad work." — a clean, self-running gallery of ad
 * creatives. It moves entirely on its own (no drag, swipe or arrows), the same
 * way on desktop and mobile.
 */
export function WinningAdsShowcase({ items, demo }: { items: ShowcaseCreative[]; demo: boolean }) {
  // A short list is repeated so the ring always looks full (same creatives,
  // never invented content). 10 uploads → shown once each.
  const cards = useMemo(() => {
    if (items.length === 0) return [];
    const reps = Math.max(1, Math.ceil(10 / items.length));
    return Array.from({ length: items.length * reps }, (_, i) => ({
      item: items[i % items.length],
      key: `${items[i % items.length].id}-${Math.floor(i / items.length)}`,
    }));
  }, [items]);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [metrics, setMetrics] = useState({ w: 260, halfStage: 720, pitch: SPACING, depth: DEPTH, tilt: MAX_TILT });
  const pos = useRef(0);

  // Measure the rendered card width (it comes from CSS) and the stage width.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const w = cardRefs.current[0]?.offsetWidth || 260;
      // phones use a tighter pitch (set in CSS as --ws-pitch) so both neighbours stay in view
      // (and a gentler curve, --ws-depth / --ws-tilt) — desktop uses the constants above
      const cs = getComputedStyle(stage);
      const num = (name: string, fallback: number) => {
        const v = parseFloat(cs.getPropertyValue(name));
        return Number.isFinite(v) ? v : fallback;
      };
      setMetrics({
        w,
        halfStage: Math.max(stage.clientWidth / 2, w),
        pitch: num("--ws-pitch", SPACING),
        depth: num("--ws-depth", DEPTH),
        tilt: num("--ws-tilt", MAX_TILT),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const n = cards.length;
  const spacing = metrics.w * metrics.pitch;
  const total = n * spacing;

  useEffect(() => {
    if (n === 0) return;
    const draw = () => {
      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const tr = cardTransform(wrappedX(i, spacing, total, pos.current), metrics.halfStage, metrics.w, metrics.depth, metrics.tilt);
        // transform + opacity only → compositor work, no layout per frame
        el.style.transform = tr.transform;
        el.style.zIndex = tr.zIndex;
        (el.firstElementChild as HTMLElement).style.opacity = tr.highlight;
      }
    };
    draw();

    // Reduced motion: a calm, static arrangement.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let running = false;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 50) / 1000 : 0;
      last = now;
      pos.current = (pos.current + SPEED * metrics.w * dt) % total;
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only animate while the section is on screen and the tab is visible.
    let onScreen = false;
    const sync = () => (onScreen && !document.hidden ? start() : stop());
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    if (stageRef.current) io.observe(stageRef.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [n, spacing, total, metrics]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="ws-title" className="ws-section relative overflow-hidden border-t border-white/5 bg-[#060609] pb-16 pt-24 sm:pb-24 sm:pt-28">
      {/* restrained ambient purple light behind the ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[60%] h-[40rem] w-[60rem] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.13), rgba(139,92,246,0.04) 60%, transparent 80%)" }}
      />

      {/* ── Copy + CTA ── */}
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-light/80">
          Creative intelligence for advertisers
        </p>
        <h2 id="ws-title" className="mt-4 text-[clamp(30px,5.4vw,56px)] font-semibold leading-[1.06] tracking-[-0.02em] text-white">
          Know what makes
          <br />
          <span className="bg-gradient-to-r from-[#C4B5FD] to-[#8B5CF6] bg-clip-text text-transparent">an ad work.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-secondary sm:text-base">
          Explore advertising creatives, uncover new ideas, and discover what you could test in your
          next campaign.
        </p>
        <Link
          href={SHOWCASE_CTA.href}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-[#7C3AED] px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_0_28px_rgba(139,92,246,0.35)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light"
        >
          {SHOWCASE_CTA.label}
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ── The self-running ring (decorative motion; not interactive) ── */}
      <div ref={stageRef} className="ws-stage relative mt-10 sm:mt-14" aria-label="Example advertising creatives" role="group">
        {cards.map(({ item, key }, i) => {
          const init = cardTransform(wrappedX(i, spacing, total, 0), metrics.halfStage, metrics.w, metrics.depth, metrics.tilt);
          return (
            <div
              key={key}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="ws-card"
              style={{ transform: init.transform, zIndex: init.zIndex }}
              aria-hidden={i >= items.length || undefined}
            >
              <span aria-hidden className="ws-highlight" style={{ opacity: init.highlight }} />
              <div className="ws-card-inner">
                {/* blurred fill of the same ad, so every format sits cleanly in a portrait card */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" aria-hidden decoding="async" draggable={false} className="ws-img-fill" />
                {/* the ad itself — always shown in full, never cropped or stretched */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={i < items.length ? item.title ?? "Advertising creative" : ""}
                  decoding="async"
                  draggable={false}
                  className="ws-img"
                />
                <span className="ws-badge" title={demo ? "Illustrative example score" : "Creatively.ai creative score"}>
                  <span className="text-brand-light">{item.score}</span>
                  <span className="text-white/45">/100</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="relative mt-6 px-6 text-center text-[11px] text-ink-muted">
        {demo
          ? "Example advertising creatives with illustrative scores — not campaign performance results."
          : "Creative scores are Creatively.ai assessments — not campaign performance results."}
      </p>

      {/* ── Compact benefits — one row of three at every width (sm+ is the desktop layout) ── */}
      <div className="relative mx-auto mt-10 grid max-w-4xl grid-cols-3 gap-2 px-3 text-center sm:mt-14 sm:gap-6 sm:px-6">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-1.5 py-3.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
          >
            <b.icon size={16} className="mx-auto text-brand-light/80" aria-hidden />
            <p className="mt-2 text-balance text-[12px] font-medium leading-snug text-ink-primary sm:mt-2.5 sm:text-sm sm:leading-normal">
              {b.title}
            </p>
            {/* shorter copy on phones so three columns fit; full copy from sm up */}
            <p className="mx-auto mt-1 text-balance text-[10.5px] leading-snug text-ink-muted sm:hidden">{b.short}</p>
            <p className="mx-auto mt-1.5 hidden max-w-[26ch] text-xs leading-relaxed text-ink-muted sm:block">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
