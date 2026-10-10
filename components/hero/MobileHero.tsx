"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HandPhoto, PhoneScreenLayer } from "@/components/hero/HandPhone";
import { AnalysisCard, TONE } from "@/components/hero/AnalysisCard";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroAmbient } from "@/components/hero/HeroAmbient";
import type { AdNaturalSize } from "@/components/hero/PhoneScreenAd";
import { handPhoneCssVars } from "@/lib/heroDemo";
import type { DemoCreative } from "@/lib/demoCreative";

/*
 * Phones and tablets (< 1024px). Same creative object, same card component and
 * same story as desktop, composed for a narrow screen:
 *
 *   headline → CTAs → hand + phone (the focal point) → an "analysis thread"
 *   that starts on the ad, runs down through the three compact cards and
 *   lights each card's node as it is revealed.
 *
 * No pinning or scroll-jacking: the phone rises once on load, each card fades
 * in once as it scrolls into view (staggered), and the thread draws with
 * scroll but never un-draws. Reduced motion → everything shown immediately.
 */

type Geometry = {
  width: number;
  height: number;
  /** thread start: on the ad, just below its call to action */
  start: { x: number; y: number };
  railX: number;
  /** y of each card's header (node position) */
  nodes: number[];
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

const RAIL_X = 22; // px from the stage's left edge
const REVEAL_STAGGER_MS = 150;

export function MobileHero({ creative, reduced }: { creative: DemoCreative; reduced: boolean }) {
  const cards = creative.analysis.cards;
  const stageRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLImageElement>(null);
  const adSize = useRef<AdNaturalSize | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const threadRefs = useRef<(SVGPathElement | null)[]>([]);
  const threadProgress = useRef(0);

  const [geo, setGeo] = useState<Geometry | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(() => cards.map(() => false));

  // ── geometry for the thread (layout positions, independent of animation) ──
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const screen = screenRef.current;
    if (!stage || !screen) return;
    const s = offsetWithin(screen, stage);

    // Bottom of the ad's drawn area (object-fit: contain).
    let adBottom = s.y + s.h * 0.94;
    const img = adRef.current;
    const nat = adSize.current;
    if (img && img.isConnected && nat?.width) {
      const box = offsetWithin(img, stage);
      const scale = Math.min(box.w / nat.width, box.h / nat.height);
      const h = nat.height * scale;
      adBottom = box.y + (box.h - h) / 2 + h;
    }

    const nodes = cardRefs.current.map((el) => (el ? offsetWithin(el, stage).y + 26 : 0));
    setGeo({
      width: stage.offsetWidth,
      height: stage.offsetHeight,
      // just below the ad's SHOP NOW button, on empty background
      start: { x: s.x + s.w / 2, y: adBottom - s.h * 0.045 },
      railX: RAIL_X,
      nodes,
    });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (stageRef.current) ro.observe(stageRef.current);
    document.fonts?.ready.then(() => measure()).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  // ── reveal each card once, in order, as it scrolls into view ──
  useEffect(() => {
    if (reduced || !("IntersectionObserver" in window)) {
      setRevealed(cards.map(() => true));
      return;
    }
    let nextSlot = 0;
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.index))
          .sort((a, b) => a - b)
          .forEach((index) => {
            const el = cardRefs.current[index];
            if (el) io.unobserve(el);
            const now = performance.now();
            const at = Math.max(now, nextSlot);
            nextSlot = at + REVEAL_STAGGER_MS;
            timers.push(
              window.setTimeout(() => {
                setRevealed((prev) => {
                  // keep the order: revealing card n also reveals any earlier card
                  const next = [...prev];
                  for (let i = 0; i <= index; i++) next[i] = true;
                  return next;
                });
              }, at - now)
            );
          });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [reduced, cards]);

  // ── thread draws with scroll, monotonic (never un-draws) ──
  useEffect(() => {
    const paths = threadRefs.current.filter(Boolean) as SVGPathElement[];
    if (!paths.length) return;
    const set = (p: number) => paths.forEach((path) => (path.style.strokeDashoffset = String(1 - p)));
    if (reduced) {
      threadProgress.current = 1;
      set(1);
      return;
    }
    set(threadProgress.current);
    let frame = 0;
    const read = () => {
      frame = 0;
      const list = listRef.current;
      if (!list) return;
      const vh = window.innerHeight;
      const r = list.getBoundingClientRect();
      // starts as the top of the card list nears the lower part of the screen,
      // completes once the last card is comfortably in view
      const p = Math.min(1, Math.max(0, (vh * 0.95 - (r.top - 140)) / (r.height + 140 - vh * 0.25)));
      if (p > threadProgress.current) {
        threadProgress.current = p;
        set(p);
      }
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
  }, [reduced, geo]);

  const threadD = geo
    ? (() => {
        const { start, railX, nodes } = geo;
        const bendY = nodes[0] - 44;
        const last = nodes[nodes.length - 1];
        return [
          `M ${start.x} ${start.y}`,
          `L ${start.x} ${bendY - 72}`,
          `C ${start.x} ${bendY - 8}, ${railX} ${bendY - 44}, ${railX} ${bendY + 16}`,
          `L ${railX} ${last}`,
        ].join(" ");
      })()
    : "";

  const pathStyle: React.CSSProperties = { strokeDasharray: 1, strokeDashoffset: 1 };

  return (
    <section
      id="top-mobile"
      aria-label={`Example: visual analysis of a ${creative.brand} ad`}
      className="relative overflow-hidden bg-[#08080B] pb-16 pt-[88px] lg:hidden"
    >
      <HeroAmbient />

      <HeroHeadline className="relative z-10" />

      <div
        ref={stageRef}
        className="relative z-10 mx-auto mt-3 w-full max-w-[540px]"
        style={{
          ...(handPhoneCssVars() as React.CSSProperties),
          // phone display width: legible, but leaves room around it
          ["--m-sw" as string]: "clamp(172px, 52vw, 248px)",
          ["--m-photo-w" as string]: "calc(var(--m-sw) / var(--scr-w))",
        }}
      >
        {/* hand + phone, cropped mid-palm and fading into the page */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: "calc(var(--m-photo-w) / var(--hp-aspect) * (var(--scr-top) + var(--scr-h) + 0.1))",
            WebkitMaskImage: "linear-gradient(to bottom, black 76%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 76%, transparent 100%)",
          }}
        >
          {/* backdrop inside the masked group so the photo's black blends into page colour + halo */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[#08080B]"
            style={{ backgroundImage: "radial-gradient(circle at 50% 42%, rgba(124,58,237,0.22), transparent 60%)" }}
          />
          <div
            className={`absolute top-0 mix-blend-lighten ${reduced ? "" : "hero-rise"}`}
            style={{ width: "var(--m-photo-w)", left: "calc(50% - var(--m-photo-w) / 2)" }}
          >
            <HandPhoto className="w-full" />
          </div>
          <div
            className={`absolute top-0 ${reduced ? "" : "hero-rise"}`}
            style={{ width: "var(--m-photo-w)", left: "calc(50% - var(--m-photo-w) / 2)" }}
          >
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

        {/* analysis thread: ad → cards */}
        {geo && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20"
            width={geo.width}
            height={geo.height}
            viewBox={`0 0 ${geo.width} ${geo.height}`}
          >
            <path
              ref={(el) => {
                threadRefs.current[0] = el;
              }}
              d={threadD}
              pathLength={1}
              fill="none"
              stroke="rgba(167,139,250,0.2)"
              strokeWidth={5}
              strokeLinecap="round"
              style={pathStyle}
            />
            <path
              ref={(el) => {
                threadRefs.current[1] = el;
              }}
              d={threadD}
              pathLength={1}
              fill="none"
              stroke="rgba(196,181,253,0.85)"
              strokeWidth={1.25}
              strokeLinecap="round"
              style={pathStyle}
            />
            {/* anchor on the ad */}
            <circle cx={geo.start.x} cy={geo.start.y} r={8} fill="rgba(167,139,250,0.2)" className="hero-anchor-pulse" />
            <circle cx={geo.start.x} cy={geo.start.y} r={3} fill="#C4B5FD" stroke="white" strokeOpacity={0.75} />
            {/* one node per card, lit when its card is revealed */}
            {cards.map((card, i) => {
              const rgb = TONE[card.tone].rgb;
              const on = revealed[i];
              return (
                <g key={card.id} style={{ opacity: on ? 1 : 0.3, transition: "opacity 500ms ease" }}>
                  <circle cx={geo.railX} cy={geo.nodes[i]} r={7} fill={`rgba(${rgb},${on ? 0.2 : 0})`} />
                  <circle cx={geo.railX} cy={geo.nodes[i]} r={3} fill={on ? `rgb(${rgb})` : "rgba(255,255,255,0.4)"} />
                </g>
              );
            })}
          </svg>
        )}

        {/* the three findings — compact, emerging in order */}
        <ol ref={listRef} className="relative z-10 -mt-3 space-y-3 pl-[44px] pr-4 sm:pr-6">
          {cards.map((card, i) => (
            <li
              key={card.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-index={i}
              className={`m-card-reveal ${revealed[i] ? "is-visible" : ""}`}
            >
              <AnalysisCard card={card} variant="compact" />
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-4 max-w-[340px] px-6 text-center text-[11px] leading-snug text-white/40">
          {creative.analysis.disclaimer}
        </p>
      </div>

      {/* without JavaScript the cards are simply shown */}
      <noscript>
        <style>{`.m-card-reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>
    </section>
  );
}
