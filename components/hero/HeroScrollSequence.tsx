"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HandPhoto, PhoneScreenLayer } from "@/components/hero/HandPhone";
import { AnalysisCard } from "@/components/hero/AnalysisCard";
import { ConnectorLines, type ConnectorLine, type ConnectorLinesHandle } from "@/components/hero/ConnectorLines";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroAmbient } from "@/components/hero/HeroAmbient";
import { MobileHero } from "@/components/hero/MobileHero";
import type { AdNaturalSize } from "@/components/hero/PhoneScreenAd";
import { HERO_DISCLAIMER, heroAnalysis } from "@/lib/heroDemo";

// useLayoutEffect warns during SSR; this is the standard isomorphic shim.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/*
 * Scroll timeline (p = 0 → 1 across the pinned section, ~150vh of scrolling):
 *   0.00–0.20  headline lifts away
 *   0.00–0.36  hand + phone travel from the lower half up to centre stage
 *   0.34 / 0.47 / 0.60  cards emerge from behind the phone (each over 0.20)
 *   card start + 0.14 → +0.26  connector line draws to the ad
 *   0.86–1.00  everything holds, readable, then the page scrolls on
 */
const PHONE_END = 0.36;
const CARD_STARTS = [0.34, 0.47, 0.6];
const CARD_DURATION = 0.2;
const LINE_DELAY = 0.14;
const LINE_DURATION = 0.12;
const CARD_ROTATION = [-7, 7, -5];

type Measured = {
  width: number;
  height: number;
  lines: ConnectorLine[];
  /** per card: offset from the card's centre to the phone screen's centre */
  deltas: { dx: number; dy: number }[];
};

/** Sum offsetLeft/Top up to `root`. Ignores transforms on purpose — we want final layout positions. */
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

export function HeroScrollSequence() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      <DesktopHero reduced={reduced} />
      <MobileHero reduced={reduced} />
    </>
  );
}

function DesktopHero({ reduced }: { reduced: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const screenLayerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLImageElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linesRef = useRef<ConnectorLinesHandle>(null);
  const disclaimerRef = useRef<HTMLParagraphElement>(null);
  const adSize = useRef<AdNaturalSize | null>(null);
  const measuredRef = useRef<Measured | null>(null);
  const progressRef = useRef(reduced ? 1 : 0);

  const [measured, setMeasured] = useState<Measured | null>(null);

  // ── apply one progress value to every moving element (transform/opacity only) ──
  const apply = useCallback(
    (p: number) => {
      progressRef.current = p;
      const vh = window.innerHeight;

      if (headlineRef.current) {
        const h = clamp01(p / 0.2);
        headlineRef.current.style.opacity = String(1 - h);
        headlineRef.current.style.transform = `translate3d(0, ${-56 * easeOutCubic(h)}px, 0)`;
        headlineRef.current.style.pointerEvents = h > 0.5 ? "none" : "auto";
        headlineRef.current.style.visibility = h >= 1 ? "hidden" : "visible";
      }

      {
        const m = easeInOutCubic(clamp01(p / PHONE_END));
        const settle = Math.max(0, p - PHONE_END) * 36; // gentle drift once settled — keeps it alive
        const y = (1 - m) * vh * 0.56 - settle;
        const scale = 0.93 + 0.07 * m;
        const rot = (1 - m) * -2.2;
        const transform = `translate3d(0, ${y}px, 0) scale(${scale}) rotate(${rot}deg)`;
        if (photoRef.current) photoRef.current.style.transform = transform;
        if (screenLayerRef.current) screenLayerRef.current.style.transform = transform;
      }

      const deltas = measuredRef.current?.deltas;
      heroAnalysis.forEach((card, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const t = easeOutCubic(clamp01((p - CARD_STARTS[i]) / CARD_DURATION));
        const d = deltas?.[i] ?? { dx: 0, dy: 0 };
        const k = (1 - t) * 0.92;
        el.style.transform = `translate3d(${d.dx * k}px, ${d.dy * k}px, 0) scale(${0.72 + 0.28 * t}) rotate(${
          (1 - t) * CARD_ROTATION[i]
        }deg)`;
        el.style.opacity = String(clamp01((t - 0.12) / 0.5));
        // Behind the phone while emerging, in front once it has cleared it.
        el.style.zIndex = t > 0.55 ? "30" : "5";
        el.style.visibility = t <= 0 ? "hidden" : "visible";

        linesRef.current?.setProgress(card.id, (p - CARD_STARTS[i] - LINE_DELAY) / LINE_DURATION);
      });

      if (disclaimerRef.current) {
        disclaimerRef.current.style.opacity = String(clamp01((p - 0.5) / 0.2));
      }
    },
    []
  );

  // ── measure final layout positions → connector endpoints + emerge deltas ──
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const screen = screenRef.current;
    if (!stage || !screen) return;

    const s = offsetWithin(screen, stage);
    const screenCx = s.x + s.w / 2;
    const screenCy = s.y + s.h / 2;

    // The ad's drawn area inside its object-fit: contain box.
    let adBox = { x: s.x, y: s.y, w: s.w, h: s.h };
    const img = adRef.current;
    if (img && img.isConnected) {
      const box = offsetWithin(img, stage);
      const nat = adSize.current;
      if (nat && nat.width && nat.height) {
        const scale = Math.min(box.w / nat.width, box.h / nat.height);
        const w = nat.width * scale;
        const h = nat.height * scale;
        adBox = { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
      } else {
        adBox = { x: box.x, y: box.y, w: box.w, h: box.h };
      }
    }

    const lines: ConnectorLine[] = [];
    const deltas: Measured["deltas"] = [];
    heroAnalysis.forEach((card, i) => {
      const el = cardRefs.current[i];
      if (!el) {
        deltas.push({ dx: 0, dy: 0 });
        return;
      }
      const c = offsetWithin(el, stage);
      const cardCx = c.x + c.w / 2;
      const cardCy = c.y + c.h / 2;
      deltas.push({ dx: screenCx - cardCx, dy: screenCy - cardCy });

      const leftOfPhone = cardCx < screenCx;
      const from = { x: leftOfPhone ? c.x + c.w : c.x, y: c.y + 34 };
      card.anchors.forEach((a, j) => {
        lines.push({
          id: j === 0 ? card.id : `${card.id}-${j}`,
          tone: card.tone,
          from,
          to: { x: adBox.x + a.x * adBox.w, y: adBox.y + a.y * adBox.h },
        });
      });
    });

    const next = { width: stage.offsetWidth, height: stage.offsetHeight, lines, deltas };
    measuredRef.current = next;
    setMeasured(next);
  }, []);

  // Re-apply after lines re-render so freshly mounted paths get the current state.
  useIsoLayoutEffect(() => {
    apply(progressRef.current);
  }, [measured, apply]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (stageRef.current) ro.observe(stageRef.current);
    // Fonts change card heights → re-measure once they're ready.
    document.fonts?.ready.then(() => measure()).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  // ── scroll → progress ──
  useEffect(() => {
    if (reduced) {
      apply(1);
      return;
    }
    let frame = 0;
    const read = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const total = section.offsetHeight - window.innerHeight;
      const rect = section.getBoundingClientRect();
      apply(total > 0 ? clamp01(-rect.top / total) : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, apply]);

  const [green, red, purple] = heroAnalysis;
  const phoneBoxStyle: React.CSSProperties = {
    top: "var(--hp-top)",
    left: "calc(50% - var(--hp-w) / 2)",
    transformOrigin: "50% 30%",
  };
  const cardBase = "absolute w-[var(--card-w)]";

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Creatively.ai — example ad analysis"
      className="relative hidden lg:block"
      style={{ height: reduced ? "auto" : "250vh" }}
    >
      {reduced && <HeroHeadline className="relative z-10 pb-6 pt-32" />}

      <div
        className={`${reduced ? "relative" : "sticky top-0"} h-screen min-h-[680px] overflow-hidden bg-[#08080B]`}
      >
        <HeroAmbient />

        <div
          ref={stageRef}
          className="hero-stage absolute inset-0"
        >
          {!reduced && (
            <HeroHeadline
              ref={headlineRef}
              className="absolute inset-x-0 top-[calc(64px+7vh)] z-40 will-change-transform"
            />
          )}

          {/* hand photo — blended so its black background disappears into the stage */}
          <div
            ref={photoRef}
            className="pointer-events-none absolute z-10 w-[var(--hp-w)] mix-blend-lighten will-change-transform"
            style={phoneBoxStyle}
          >
            <div className={reduced ? "" : "hero-rise"}>
              <HandPhoto className="w-full" />
            </div>
          </div>

          {/* phone display — the replaceable ad, never blended */}
          <div
            ref={screenLayerRef}
            className="pointer-events-none absolute z-[12] w-[var(--hp-w)] will-change-transform"
            style={phoneBoxStyle}
          >
            <div className={reduced ? "" : "hero-rise"}>
              <PhoneScreenLayer
                ref={adRef}
                screenRef={screenRef}
                className="w-full"
                onAdLoad={(size) => {
                  adSize.current = size;
                  measure();
                }}
              />
            </div>
          </div>

          {/* analysis cards — final layout positions; JS animates them in from behind the phone */}
          <AnalysisCard
            ref={(el) => {
              cardRefs.current[0] = el;
            }}
            card={green}
            className={`${cardBase} will-change-transform`}
            style={{ right: "var(--card-inset)", top: "var(--card-top-a)" }}
          />
          <AnalysisCard
            ref={(el) => {
              cardRefs.current[1] = el;
            }}
            card={red}
            className={`${cardBase} will-change-transform`}
            style={{ left: "var(--card-inset)", top: "var(--card-top-b)" }}
          />
          <AnalysisCard
            ref={(el) => {
              cardRefs.current[2] = el;
            }}
            card={purple}
            className={`${cardBase} will-change-transform`}
            style={{ right: "var(--card-inset)", bottom: "var(--card-bottom-c)" }}
          />

          {measured && (
            <ConnectorLines
              ref={linesRef}
              lines={measured.lines}
              width={measured.width}
              height={measured.height}
              className="z-[35]"
            />
          )}

          <p
            ref={disclaimerRef}
            className="absolute bottom-[3vh] left-[var(--card-inset)] z-[36] max-w-[var(--card-w)] text-[11px] leading-snug text-white/40"
            style={{ opacity: reduced ? 1 : 0 }}
          >
            {HERO_DISCLAIMER}
          </p>
        </div>

        {/* soft fade into the next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-b from-transparent to-[#08080B]" />
      </div>
    </section>
  );
}
