"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HandPhoto, PhoneScreenLayer } from "@/components/hero/HandPhone";
import { AnalysisCard } from "@/components/hero/AnalysisCard";
import { FullAnalysisButton } from "@/components/hero/FullAnalysisButton";
import { ConnectorLines, type ConnectorLine, type ConnectorLinesHandle } from "@/components/hero/ConnectorLines";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroAmbient } from "@/components/hero/HeroAmbient";
import type { AdNaturalSize } from "@/components/hero/PhoneScreenAd";
import { handPhoneCssVars } from "@/lib/heroDemo";
import type { DemoCreative } from "@/lib/demoCreative";

/*
 * Phones and tablets (< 1024px): the desktop scene, scaled down.
 *
 * Same pieces, same arrangement as desktop — hand + phone in the centre, the
 * green card upper-left, red to the right, purple lower-left, glowing lines
 * from each card to the same point on the ad — just sized for a narrow screen
 * with CSS variables (see `.m-scene` in globals.css). Cards show their short
 * labels; the complete report opens from "Show full analysis" below.
 *
 * Animation mirrors desktop: the phone rises in, then — driven by the scroll
 * position, and reversible — the cards emerge from behind the phone in order
 * and their lines draw; scrolling back up retracts them.
 */

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Smoothing time constant for scroll-linked progress (touch-friendly, no overshoot). */
const SMOOTHING_MS = 90;
const CARD_STARTS = [0, 0.2, 0.4];
const CARD_DURATION = 0.42;
const LINE_DELAY = 0.3;
const LINE_DURATION = 0.28;
const CARD_ROTATION = [-6, 6, -4];
/** Let the phone finish rising in before the cards can appear. */
const MIN_DELAY_AFTER_MOUNT_MS = 1600;

type Measured = {
  width: number;
  height: number;
  lines: ConnectorLine[];
  deltas: { dx: number; dy: number }[];
};

function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function MobileHero({ creative, reduced }: { creative: DemoCreative; reduced: boolean }) {
  const cards = creative.analysis.cards;
  const [green, red, purple] = cards;

  const sceneRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLImageElement>(null);
  const adSize = useRef<AdNaturalSize | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linesRef = useRef<ConnectorLinesHandle>(null);
  const measuredRef = useRef<Measured | null>(null);
  const progressRef = useRef(0);
  const [measured, setMeasured] = useState<Measured | null>(null);

  // ── one progress value (0 → 1) drives cards + lines, transform/opacity only ──
  const apply = useCallback(
    (t: number) => {
      progressRef.current = t;
      const deltas = measuredRef.current?.deltas;
      cards.forEach((card, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const e = easeOutCubic(clamp01((t - CARD_STARTS[i]) / CARD_DURATION));
        const d = deltas?.[i] ?? { dx: 0, dy: 0 };
        const k = (1 - e) * 0.9;
        el.style.transform = `translate3d(${d.dx * k}px, ${d.dy * k}px, 0) scale(${0.7 + 0.3 * e}) rotate(${
          (1 - e) * CARD_ROTATION[i]
        }deg)`;
        el.style.opacity = String(clamp01((e - 0.1) / 0.5));
        el.style.visibility = e <= 0 ? "hidden" : "visible";
        // behind the phone while emerging, in front once clear of it
        el.style.zIndex = e > 0.55 ? "25" : "5";
        linesRef.current?.setProgress(card.id, (t - CARD_STARTS[i] - LINE_DELAY) / LINE_DURATION);
      });
    },
    [cards]
  );

  // ── measure final layout → connector endpoints + "emerge from the phone" offsets ──
  const measure = useCallback(() => {
    const scene = sceneRef.current;
    const screen = screenRef.current;
    if (!scene || !screen) return;
    const s = offsetWithin(screen, scene);
    const screenCx = s.x + s.w / 2;
    const screenCy = s.y + s.h / 2;

    let ad = { x: s.x, y: s.y, w: s.w, h: s.h };
    const img = adRef.current;
    const nat = adSize.current;
    if (img && img.isConnected && nat?.width) {
      const box = offsetWithin(img, scene);
      const scale = Math.min(box.w / nat.width, box.h / nat.height);
      const w = nat.width * scale;
      const h = nat.height * scale;
      ad = { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
    }
    const anchor = (i: number) => ({ x: ad.x + cards[i].anchor.x * ad.w, y: ad.y + cards[i].anchor.y * ad.h });

    const rects = cardRefs.current.map((el) => (el ? offsetWithin(el, scene) : null));
    const deltas = rects.map((c) => (c ? { dx: screenCx - (c.x + c.w / 2), dy: screenCy - (c.y + c.h / 2) } : { dx: 0, dy: 0 }));

    const lines: ConnectorLine[] = [];
    const [g, r, p] = rects;
    if (g) {
      // green sits above the phone: drop from its lower edge to the logo
      const to = anchor(0);
      const x = Math.min(Math.max(to.x, g.x + 24), g.x + g.w - 24);
      lines.push({ id: cards[0].id, tone: cards[0].tone, axis: "y", from: { x, y: g.y + g.h }, to });
    }
    if (r) {
      // red sits right of the phone: rise from its upper edge to the end of the headline
      lines.push({ id: cards[1].id, tone: cards[1].tone, axis: "y", from: { x: r.x + 18, y: r.y }, to: anchor(1) });
    }
    if (p) {
      // purple sits below-left: rise from its upper edge, outside the screen, to the benefit list
      const to = anchor(2);
      const x = Math.min(Math.max(s.x - 16, p.x + 20), p.x + p.w - 20);
      lines.push({ id: cards[2].id, tone: cards[2].tone, axis: "y", from: { x, y: p.y }, to });
    }

    const next = { width: scene.offsetWidth, height: scene.offsetHeight, lines, deltas };
    measuredRef.current = next;
    setMeasured(next);
  }, [cards]);

  useIsoLayoutEffect(() => {
    apply(progressRef.current);
  }, [measured, apply]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (sceneRef.current) ro.observe(sceneRef.current);
    document.fonts?.ready.then(() => measure()).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  // ── scroll-linked and reversible, like desktop ──
  // Progress follows the scroll position: scrolling down reveals green → red →
  // purple (lines drawing after each card); scrolling back up reverses it.
  // A short critically-damped smoothing step keeps touch scrolling fluid.
  useEffect(() => {
    if (reduced) {
      apply(1);
      return;
    }
    const mountedAt = performance.now();
    let target = 0;
    let current = progressRef.current;
    let raf = 0;
    let last = 0;
    let riseTimer = 0;

    const readTarget = () => {
      const scene = sceneRef.current;
      if (!scene) return 0;
      // Hold the cards back until the phone has finished rising in.
      if (performance.now() - mountedAt < MIN_DELAY_AFTER_MOUNT_MS) return 0;
      const vh = window.innerHeight;
      const sceneDocTop = scene.getBoundingClientRect().top + window.scrollY;
      const start = Math.max(0, sceneDocTop - vh * 0.7);
      // about two-thirds of a screen of scrolling plays the whole sequence
      const range = Math.min(560, Math.max(300, vh * 0.6));
      return clamp01((window.scrollY - start) / range);
    };

    const step = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const k = 1 - Math.exp(-dt / SMOOTHING_MS);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0008) current = target;
      apply(current);
      raf = current === target ? 0 : requestAnimationFrame(step);
      if (!raf) last = 0;
    };

    const update = () => {
      target = readTarget();
      if (!raf && target !== current) raf = requestAnimationFrame(step);
    };

    update();
    riseTimer = window.setTimeout(update, MIN_DELAY_AFTER_MOUNT_MS + 20);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      clearTimeout(riseTimer);
      cancelAnimationFrame(raf);
    };
  }, [reduced, apply]);

  const hidden: React.CSSProperties = reduced ? {} : { opacity: 0, visibility: "hidden" };

  return (
    <section
      id="top-mobile"
      aria-label={`Example: visual analysis of a ${creative.brand} ad`}
      className="relative overflow-hidden bg-[#08080B] pb-14 pt-[88px] lg:hidden"
    >
      <HeroAmbient />

      <HeroHeadline className="relative z-10" />

      {/* ── the scene: desktop composition, scaled for a narrow screen ── */}
      <div ref={sceneRef} className="m-scene relative mx-auto mt-7 w-full max-w-[560px]" style={handPhoneCssVars() as React.CSSProperties}>
        {/* hand photo — blended so its black background disappears; clipped to the scene and faded out */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-lighten"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
          }}
        >
          <div className="absolute" style={{ width: "var(--photo-w)", left: "calc(50% - var(--photo-w) / 2)", top: "var(--photo-top)" }}>
            <div className={reduced ? "" : "hero-rise"}>
              <HandPhoto className="w-full" />
            </div>
          </div>
        </div>

        {/* phone display — the Buffy ad, never blended */}
        <div
          className="pointer-events-none absolute z-[12]"
          style={{ width: "var(--photo-w)", left: "calc(50% - var(--photo-w) / 2)", top: "var(--photo-top)" }}
        >
          <div className={reduced ? "" : "hero-rise"}>
            <PhoneScreenLayer
              ref={adRef}
              screenRef={screenRef}
              image={creative.image}
              className="w-full"
              onAdLoad={(size) => {
                adSize.current = size;
                measure();
              }}
            />
          </div>
        </div>

        {/* green — upper left */}
        <AnalysisCard
          ref={(el) => {
            cardRefs.current[0] = el;
          }}
          card={green}
          variant="mini"
          className="m-hero-card absolute will-change-transform"
          style={{ ...hidden, left: "var(--g)", top: "0px", width: "var(--green-w)" }}
        />
        {/* red — right */}
        <AnalysisCard
          ref={(el) => {
            cardRefs.current[1] = el;
          }}
          card={red}
          variant="mini"
          className="m-hero-card absolute will-change-transform"
          style={{ ...hidden, right: "var(--g)", top: "var(--red-top)", width: "var(--red-w)" }}
        />

        {/* reserves the phone's height; purple then sits in flow below-left, so the scene height is exact */}
        <div aria-hidden style={{ height: "var(--purple-top)" }} />

        {/* purple — lower left */}
        <AnalysisCard
          ref={(el) => {
            cardRefs.current[2] = el;
          }}
          card={purple}
          variant="mini"
          className="m-hero-card will-change-transform"
          style={{ ...hidden, marginLeft: "var(--g)", width: "var(--purple-w)" }}
        />
        <div aria-hidden className="h-[var(--scene-tail)]" />

        {measured && (
          <ConnectorLines
            ref={linesRef}
            lines={measured.lines}
            width={measured.width}
            height={measured.height}
            className="z-[30]"
          />
        )}
      </div>

      {/* the complete report, one tap away */}
      <div className="relative z-10 mx-auto mt-4 max-w-[560px] px-[var(--g,12px)] text-center">
        <FullAnalysisButton creative={creative} />
        <p className="mx-auto mt-3 max-w-[320px] text-[11px] leading-snug text-white/40">{creative.analysis.disclaimer}</p>
      </div>

      {/* without JavaScript the cards are simply shown in place */}
      <noscript>
        <style>{`.m-hero-card{opacity:1!important;visibility:visible!important}`}</style>
      </noscript>
    </section>
  );
}
