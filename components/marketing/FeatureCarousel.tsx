"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Pause,
  Play,
  TrendingUp,
  LayoutGrid,
  Bookmark,
  Wand2,
  Globe,
  Lightbulb,
  ImagePlus,
} from "lucide-react";
import { AdMock } from "@/components/marketing/strategy/AdMock";
import { AD_VARIANTS, CONCEPTS, DEMO_BRAND } from "@/lib/strategyShowcase";
import {
  BACK_CALLOUTS,
  BUFFY_AD,
  LIBRARY,
  RIPTIDE_AD,
  SAMPLE_ACCOUNT,
  SELL_CALLOUTS,
  SELL_SCORE,
  TOUR_DISCLAIMER,
  type TourAd,
} from "@/lib/tourExamples";

/*
 * Feature carousel — five portrait cards (Holo-style proportions) showing what
 * Creatively.ai does: what’s working, Creative Strategy, account data, what’s holding an ad back,
 * and the winning-ads library.
 *
 * Motion (all disabled for prefers-reduced-motion):
 *  - plays by itself with a story-style progress bar; pauses on hover/focus,
 *    off-screen, and after manual interaction; swipe, mouse-drag, arrows, tabs
 *  - active card: rotating light beam around its border, a one-off light sweep,
 *    pointer-following spotlight, and its contents animate in each time
 *  - slow ambient aurora behind the track
 * Card internals are sized in container-query units (cqw), so every card keeps
 * identical proportions at any width.
 */

const AUTOPLAY_MS = 5600;
const RESUME_AFTER_INTERACTION_MS = 9000;
const TILT = [-2.4, 1.9, -1.7, 2.3, -2.0];

type Tone = { rgb: string; text: string };
const GREEN: Tone = { rgb: "34,197,94", text: "#4ADE80" };
const VIOLET: Tone = { rgb: "139,92,246", text: "#A78BFA" };
const RED: Tone = { rgb: "244,63,94", text: "#FB7185" };
const BLUE: Tone = { rgb: "96,165,250", text: "#93C5FD" };
const FUCHSIA: Tone = { rgb: "217,70,239", text: "#F0ABFC" };

type Slide = {
  id: string;
  file: string;
  tone: Tone;
  icon: typeof BarChart3;
  iconBg: string;
  title: [string, string];
  body: string;
  /** where the visual starts (default 44% of the card) — for a longer body */
  visualTop?: string;
  Visual: (p: { active: boolean }) => JSX.Element;
};

const SLIDES: Slide[] = [
  {
    id: "sell",
    file: "ads-that-sell",
    tone: GREEN,
    icon: TrendingUp,
    iconBg: "linear-gradient(145deg,#4ADE80,#15803D)",
    title: ["Ads that", "sell."],
    body: "Spot what’s working in your ad creative and understand which elements make it stronger.",
    Visual: SellVisual,
  },
  {
    id: "strategy",
    file: "ai-creative-strategy",
    tone: FUCHSIA,
    icon: Wand2,
    iconBg: "linear-gradient(145deg,#F0ABFC,#A21CAF)",
    title: ["AI Creative", "Strategy."],
    body: "Turn your website or social profile into a tailored advertising strategy. Discover creative angles, develop stronger messaging, and generate ad variations built around your brand.",
    visualTop: "47%",
    Visual: StrategyVisual,
  },
  {
    id: "accounts",
    file: "high-performing-ad-accounts",
    tone: BLUE,
    icon: BarChart3,
    iconBg: "linear-gradient(145deg,#818CF8,#4F46E5)",
    title: ["High-performing", "ad accounts."],
    body: "See your advertising data more clearly and uncover opportunities to improve your campaigns.",
    Visual: AccountsVisual,
  },
  {
    id: "back",
    file: "find-whats-holding-you-back",
    tone: RED,
    icon: AlertCircle,
    iconBg: "linear-gradient(145deg,#FB7185,#BE123C)",
    title: ["Find what’s holding", "your ad back."],
    body: "Identify creative weaknesses, missed opportunities, and what may be keeping your ad from communicating clearly.",
    Visual: BackVisual,
  },
  {
    id: "library",
    file: "winning-ads-library",
    tone: VIOLET,
    icon: LayoutGrid,
    iconBg: "linear-gradient(145deg,#C4B5FD,#7C3AED)",
    title: ["Explore our", "winning ads library."],
    body: "Discover advertising creatives, explore different approaches, and find inspiration for your next test.",
    Visual: LibraryVisual,
  },
];

export function FeatureCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [holdUntil, setHoldUntil] = useState(0);
  const drag = useRef<{ x: number; left: number; moved: boolean; id: number } | null>(null);
  const suppressClick = useRef(false);

  const playing = !reduced && !userPaused && inView && !hovering && !focusWithin;

  const nearestIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(nearestIndex()));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [nearestIndex]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => {
      mq.removeEventListener("change", onChange);
      io.disconnect();
    };
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const n = SLIDES.length;
      const idx = ((i % n) + n) % n;
      const el = cardRefs.current[idx];
      if (!track || !el) return;
      track.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced]
  );

  const manual = (fn: () => void) => {
    setHoldUntil(Date.now() + RESUME_AFTER_INTERACTION_MS);
    fn();
  };

  useEffect(() => {
    if (!playing) return;
    const wait = Math.max(AUTOPLAY_MS, holdUntil - Date.now());
    const t = window.setTimeout(() => goTo(active + 1), wait);
    return () => clearTimeout(t);
  }, [playing, active, holdUntil, goTo]);

  // mouse drag (touch swipes natively)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !trackRef.current) return;
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const track = trackRef.current;
    if (!d || !track) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      track.setPointerCapture(d.id);
      track.style.scrollSnapType = "none";
      track.style.cursor = "grabbing";
    }
    if (d.moved) track.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    const d = drag.current;
    const track = trackRef.current;
    drag.current = null;
    if (!d || !track || !d.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    track.style.scrollSnapType = "";
    track.style.cursor = "";
    manual(() => goTo(nearestIndex()));
  };

  return (
    <section ref={sectionRef} id="features" aria-labelledby="fc-title" className="fc-section relative scroll-mt-24 overflow-hidden bg-[#08080B] pb-10 pt-8 sm:pb-14">
      {/* ambient aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="fc-aurora fc-aurora-a" />
        <div className="fc-aurora fc-aurora-b" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brand-light/90">What Creatively.ai does</p>
        <h2 id="fc-title" className="mt-3 text-balance text-[clamp(26px,3.6vw,42px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
          Understand every ad before you scale it.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-[#9A9AA5]">
          Analyze creatives, read your account data, diagnose weaknesses and find inspiration — in one place.
        </p>
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Creatively.ai features"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setFocusWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false);
        }}
        onTouchStart={() => setHoldUntil(Date.now() + RESUME_AFTER_INTERACTION_MS)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="fc-track relative mt-8 flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain py-12 sm:gap-7"
      >
        {SLIDES.map((s, i) => {
          const isActive = i === active;
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${s.title.join(" ")}`}
              data-card={s.file}
              className={`fc-card relative shrink-0 snap-center select-none ${isActive ? "is-active" : ""}`}
              style={
                {
                  "--tone": s.tone.rgb,
                  transform: `rotate(${isActive ? TILT[i] * 0.5 : TILT[i]}deg) scale(${isActive ? 1 : 0.92})`,
                  opacity: isActive ? 1 : 0.5,
                } as React.CSSProperties
              }
              onClick={() => {
                if (suppressClick.current) return;
                if (!isActive) manual(() => goTo(i));
              }}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
                e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
              }}
            >
              <div className="fc-surface">
                <div aria-hidden className="fc-beam" />
                <div aria-hidden className="fc-shine" />
                <div aria-hidden className="fc-spot" />
                <div aria-hidden className="fc-tonewash" />

                {/* header */}
                <div className="relative z-10 flex flex-col items-center px-[7cqw] pt-[8cqw] text-center">
                  <span
                    className="fc-in flex h-[12cqw] w-[12cqw] items-center justify-center rounded-[3.2cqw] text-white"
                    style={{ background: s.iconBg, boxShadow: `0 2cqw 6cqw -2cqw rgba(${s.tone.rgb},0.8), inset 0 1px 0 rgba(255,255,255,0.35)`, ["--d" as string]: "0ms" }}
                  >
                    <Icon className="h-[6cqw] w-[6cqw]" strokeWidth={2.2} />
                  </span>
                  <h3
                    className="fc-in mt-[4.5cqw] text-[7.4cqw] font-semibold leading-[1.06] tracking-[-0.02em] text-white"
                    style={{ ["--d" as string]: "80ms" }}
                  >
                    {s.title[0]}{" "}
                    <span style={{ color: s.tone.text, textShadow: `0 0 6cqw rgba(${s.tone.rgb},0.45)` }}>{s.title[1]}</span>
                  </h3>
                  <p className="fc-in mt-[3cqw] max-w-[82cqw] text-[max(11px,3.45cqw)] leading-[1.45] text-white/60" style={{ ["--d" as string]: "160ms" }}>
                    {s.body}
                  </p>
                </div>

                {/* visual */}
                <div className="absolute inset-x-0 bottom-0 z-10" style={{ top: s.visualTop ?? "44%" }}>
                  <s.Visual active={isActive} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* progress + controls */}
      <div className="relative mx-auto w-[min(560px,calc(100%-32px))]">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Choose a feature">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={s.title.join(" ")}
                onClick={() => manual(() => goTo(i))}
                className="group relative h-6 flex-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.12] transition-colors group-hover:bg-white/[0.2]">
                  <span
                    key={i === active ? `on-${active}-${holdUntil}-${playing}` : "off"}
                    className={`block h-full rounded-full bg-gradient-to-r from-brand to-brand-light ${
                      i < active ? "w-full" : i === active ? (reduced ? "w-full" : "tour-progress") : "w-0"
                    }`}
                    style={
                      i === active && !reduced
                        ? { animationDuration: `${Math.max(AUTOPLAY_MS, holdUntil - Date.now())}ms`, animationPlayState: playing ? "running" : "paused" }
                        : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label={userPaused ? "Play" : "Pause"}
              onClick={() => setUserPaused((v) => !v)}
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white/80 transition-colors hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 sm:flex"
            >
              {userPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => manual(() => goTo(active - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white transition-colors hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => manual(() => goTo(active + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white transition-colors hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-white/35">{TOUR_DISCLAIMER}</p>
      </div>
    </section>
  );
}

/* ───────────────────────── shared pieces ───────────────────────── */

function AdFrame({ ad, className = "", style, sizes = "220px" }: { ad: TourAd; className?: string; style?: React.CSSProperties; sizes?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[2.6cqw] bg-black ring-1 ring-white/15 ${className}`}
      style={{ boxShadow: "0 5cqw 10cqw -4cqw rgba(0,0,0,0.9), 0 0 0 0.6cqw rgba(255,255,255,0.04)", ...style }}
    >
      <Image src={ad.src} alt={ad.alt} width={ad.width} height={ad.height} sizes={sizes} draggable={false} className="block h-full w-full object-cover" />
    </div>
  );
}

/** The visual area is always 100 wide × VIS_H tall in the same units (card aspect 0.64, visual = bottom 56%). */
const VIS_H = 87.5;

type Box = { x: number; y: number; w: number; h: number; rot: number };
/** A point on an ad (fractions fx, fy) → percent of the visual area, honouring the ad's tilt. */
function onAd(box: Box, fx: number, fy: number): [number, number] {
  const k = VIS_H / 100; // % of height → width units
  const px = box.x + fx * box.w;
  const py = (box.y + fy * box.h) * k;
  const cx = box.x + box.w / 2;
  const cy = (box.y + box.h / 2) * k;
  const a = (box.rot * Math.PI) / 180;
  const rx = cx + (px - cx) * Math.cos(a) - (py - cy) * Math.sin(a);
  const ry = cy + (px - cx) * Math.sin(a) + (py - cy) * Math.cos(a);
  return [rx, ry / k];
}

/** Thin glowing connectors in uniform units (no stretching), endpoints in percent of the visual area. */
function Connectors({ lines, rgb }: { lines: { from: [number, number]; to: [number, number]; delay: number }[]; rgb: string }) {
  const k = VIS_H / 100;
  return (
    <svg className="pointer-events-none absolute inset-0 z-[15] h-full w-full overflow-visible" viewBox={`0 0 100 ${VIS_H}`} aria-hidden>
      {lines.map((l, i) => {
        const [x1, y1] = [l.from[0], l.from[1] * k];
        const [x2, y2] = [l.to[0], l.to[1] * k];
        const mx = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
        return (
          <g key={i}>
            <path d={d} pathLength={1} fill="none" stroke={`rgba(${rgb},0.25)`} strokeWidth={1.1} strokeLinecap="round" className="fc-draw" style={{ ["--d" as string]: `${l.delay}ms` }} />
            <path d={d} pathLength={1} fill="none" stroke={`rgba(${rgb},0.95)`} strokeWidth={0.32} strokeLinecap="round" className="fc-draw" style={{ ["--d" as string]: `${l.delay}ms` }} />
          </g>
        );
      })}
    </svg>
  );
}

function Dot({ x, y, rgb, delay }: { x: number; y: number; rgb: string; delay: number }) {
  return (
    <span
      aria-hidden
      className="fc-pop absolute z-20 h-[2.4cqw] w-[2.4cqw] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ left: `${x}%`, top: `${y}%`, background: `rgb(${rgb})`, boxShadow: `0 0 0 0.9cqw rgba(${rgb},0.25), 0 0 3cqw rgba(${rgb},0.9)`, ["--d" as string]: `${delay}ms` }}
    >
      <span className="fc-ping absolute inset-0 rounded-full" style={{ background: `rgba(${rgb},0.6)` }} />
    </span>
  );
}

function CountUp({ value, decimals, prefix = "", suffix = "", active }: { value: number; decimals: number; prefix?: string; suffix?: string; active: boolean }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1300;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);
  return (
    <>
      {prefix}
      {shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

/* ───────────────────────── card visuals ───────────────────────── */

// Ad frame geometry (percent of the visual area) for card 1 — square ad, tilted −3°.
const SELL_AD: Box = { x: 7, y: 2, w: 50, h: (50 / VIS_H) * 100, rot: -3 };

function SellVisual() {
  const pillTop = [2, 21, 40, 59];
  const lines = SELL_CALLOUTS.map((c, i) => ({
    from: [61, pillTop[i] + 4.2] as [number, number],
    to: onAd(SELL_AD, c.at.x, c.at.y),
    delay: 420 + i * 140,
  }));
  const arc = Math.PI * 34;
  return (
    <div className="relative h-full w-full">
      <div className="absolute" style={{ left: `${SELL_AD.x}%`, top: `${SELL_AD.y}%`, width: `${SELL_AD.w}%` }}>
        <AdFrame ad={RIPTIDE_AD} className="fc-in aspect-square" style={{ rotate: `${SELL_AD.rot}deg`, ["--d" as string]: "200ms" }} sizes="(max-width: 640px) 40vw, 220px" />
      </div>
      <Connectors lines={lines} rgb={GREEN.rgb} />
      {lines.map((l, i) => (
        <Dot key={i} x={l.to[0]} y={l.to[1]} rgb={GREEN.rgb} delay={l.delay + 380} />
      ))}
      {SELL_CALLOUTS.map((c, i) => (
        <div
          key={c.label}
          className="fc-in-x absolute right-[3.5%] flex w-[37%] items-center gap-[1.4cqw] rounded-[2.2cqw] border px-[2cqw] py-[1.6cqw]"
          style={{
            top: `${pillTop[i]}%`,
            borderColor: `rgba(${GREEN.rgb},0.3)`,
            background: "linear-gradient(180deg, rgba(16,30,22,0.92), rgba(10,20,15,0.92))",
            boxShadow: `0 0 5cqw -2cqw rgba(${GREEN.rgb},0.6)`,
            ["--d" as string]: `${360 + i * 140}ms`,
          }}
        >
          <span className="flex h-[3.6cqw] w-[3.6cqw] shrink-0 items-center justify-center rounded-full" style={{ background: `rgba(${GREEN.rgb},0.18)`, color: GREEN.text }}>
            <Check className="h-[2.4cqw] w-[2.4cqw]" strokeWidth={3.2} />
          </span>
          <span className="text-[max(8.5px,2.55cqw)] font-medium leading-[1.2] text-white/90">{c.label}</span>
        </div>
      ))}
      {/* compact creative score */}
      <div
        className="fc-in absolute bottom-[5%] left-[6%] w-[54%] rounded-[3cqw] border border-white/[0.09] p-[2.8cqw]"
        style={{ background: "linear-gradient(180deg, rgba(26,24,36,0.95), rgba(14,13,20,0.95))", boxShadow: "0 4cqw 9cqw -4cqw rgba(0,0,0,0.9)", ["--d" as string]: "700ms" }}
      >
        <div className="flex items-center gap-[2.4cqw]">
          <div className="relative w-[16cqw] shrink-0">
            <svg viewBox="0 0 80 46" className="w-full" aria-hidden>
              <path d="M6 40 A34 34 0 0 1 74 40" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="8" strokeLinecap="round" />
              <path
                d="M6 40 A34 34 0 0 1 74 40"
                fill="none"
                stroke="url(#fc-gauge)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(arc * SELL_SCORE.score) / 10} ${arc}`}
                className="fc-gauge"
              />
              <defs>
                <linearGradient id="fc-gauge" x1="0" x2="1">
                  <stop offset="0" stopColor="#22C55E" />
                  <stop offset="1" stopColor="#86EFAC" />
                </linearGradient>
              </defs>
            </svg>
            <p className="absolute inset-x-0 bottom-0 text-center text-[3.6cqw] font-semibold leading-none text-white">{SELL_SCORE.score.toFixed(1)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[max(9px,2.7cqw)] font-medium text-white">Creative score</p>
            <p className="text-[max(7.5px,2.1cqw)] text-white/45">Example assessment</p>
          </div>
        </div>
        <ul className="mt-[2cqw] space-y-[1.3cqw]">
          {SELL_SCORE.bars.map((b, i) => (
            <li key={b.label} className="flex items-center gap-[1.6cqw] text-[max(7.5px,2.2cqw)] text-white/65">
              <span className="w-[8cqw] shrink-0">{b.label}</span>
              <span className="relative h-[0.9cqw] flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                <span className="fc-bar absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#16A34A] to-[#4ADE80]" style={{ width: `${b.score * 10}%`, ["--d" as string]: `${900 + i * 120}ms` }} />
              </span>
              <span className="w-[5cqw] text-right text-white/85">{b.score.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="fc-in absolute bottom-[8%] right-[4%] w-[33%] rounded-[2.4cqw] border px-[2cqw] py-[1.8cqw] text-center"
        style={{ borderColor: `rgba(${GREEN.rgb},0.25)`, background: `rgba(${GREEN.rgb},0.07)`, ["--d" as string]: "1100ms" }}
      >
        <p className="text-[5.4cqw] font-semibold leading-none" style={{ color: GREEN.text }}>4</p>
        <p className="mt-[0.8cqw] text-[max(7.5px,2.15cqw)] leading-tight text-white/60">strengths found</p>
      </div>
    </div>
  );
}

function Sparkline({ points, rgb, delay }: { points: number[]; rgb: string; delay: number }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p - min) / (max - min || 1)) * 24}`).join(" L ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="fc-wipe h-[5cqw] w-full overflow-visible" style={{ ["--d" as string]: `${delay}ms` }} aria-hidden>
      <path d={`M ${d}`} fill="none" stroke={`rgb(${rgb})`} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function AccountsVisual({ active }: { active: boolean }) {
  const { metrics, trend } = SAMPLE_ACCOUNT;
  const min = Math.min(...trend) - 0.2;
  const max = Math.max(...trend) + 0.1;
  const pts = trend.map((v, i) => [(i / (trend.length - 1)) * 100, 46 - ((v - min) / (max - min)) * 40] as const);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" L ");
  const area = `M 0,50 L ${line} L 100,50 Z`;
  const tints = ["167,139,250", "34,197,94", "96,165,250", "244,114,182"];
  const last = pts[pts.length - 1];
  return (
    <div className="relative h-full w-full px-[5.5%] pb-[5%] pt-[1%]">
      <div
        className="fc-in fc-float-slow relative flex h-full flex-col rounded-[3.4cqw] border border-white/[0.09] p-[3.2cqw]"
        style={{ background: "linear-gradient(180deg, rgba(28,26,42,0.95), rgba(14,13,22,0.96))", boxShadow: "0 5cqw 12cqw -5cqw rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)", ["--d" as string]: "200ms" }}
      >
        <div className="flex items-center justify-between gap-[2cqw]">
          <div className="min-w-0">
            <p className="text-[max(9.5px,3cqw)] font-medium text-white">Account overview</p>
            <p className="text-[max(7.5px,2.2cqw)] text-white/45">Meta Ads · last 30 days</p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-300/10 px-[2cqw] py-[0.7cqw] text-[max(7.5px,2.2cqw)] font-medium text-amber-200">
            Sample data
          </span>
        </div>
        <div className="mt-[2.6cqw] grid grid-cols-2 gap-[2cqw]">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="fc-in rounded-[2.2cqw] border border-white/[0.07] bg-white/[0.03] px-[2.4cqw] py-[2cqw]"
              style={{ ["--d" as string]: `${380 + i * 110}ms` }}
            >
              <p className="text-[max(7.5px,2.2cqw)] text-white/50">{m.label}</p>
              <p className="mt-[0.4cqw] text-[max(11px,4.4cqw)] font-semibold leading-none tracking-tight text-white">
                <CountUp value={m.value} decimals={m.decimals} prefix={m.prefix} suffix={m.suffix} active={active} />
              </p>
              <div className="mt-[1.2cqw]">
                <Sparkline points={m.spark} rgb={tints[i]} delay={600 + i * 110} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[2.4cqw] flex min-h-0 flex-1 flex-col rounded-[2.2cqw] border border-white/[0.07] bg-white/[0.02] p-[2.2cqw]">
          <div className="flex items-center justify-between text-[max(7.5px,2.2cqw)]">
            <span className="text-white/70">ROAS trend</span>
            <span className="text-white/40">Sample</span>
          </div>
          <div className="relative mt-[1cqw] min-h-0 flex-1">
            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="fc-wipe absolute inset-0 h-full w-full overflow-visible" style={{ ["--d" as string]: "650ms" }} aria-hidden>
              <defs>
                <linearGradient id="fc-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="rgba(129,140,248,0.45)" />
                  <stop offset="1" stopColor="rgba(129,140,248,0)" />
                </linearGradient>
              </defs>
              {[12, 25, 38].map((y) => (
                <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={area} fill="url(#fc-area)" />
              <path d={`M ${line}`} fill="none" stroke="#A5B4FC" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <span
              className="fc-pop absolute h-[2cqw] w-[2cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C7D2FE]"
              style={{ left: `${last[0]}%`, top: `${(last[1] / 50) * 100}%`, boxShadow: "0 0 0 0.8cqw rgba(165,180,252,0.25), 0 0 3cqw rgba(165,180,252,0.9)", ["--d" as string]: "1500ms" }}
            >
              <span className="fc-ping absolute inset-0 rounded-full bg-[#A5B4FC]/60" />
            </span>
          </div>
          <div className="mt-[1cqw] flex justify-between text-[max(7px,2cqw)] text-white/35">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card 3 phone frame (percent of the visual area): 1cqw bezel around a 9:16 image, tilted 3°.
const BACK_FRAME = { x: 9, y: 3, w: 37 };
const BACK_IMG_W = BACK_FRAME.w - 2;
const BACK_IMG_H = ((BACK_IMG_W * 16) / 9 / VIS_H) * 100;
const BACK_FRAME_H = BACK_IMG_H + (2 / VIS_H) * 100;
// rotation happens around the frame's centre; express the image box with the same centre
const BACK_AD: Box = { x: BACK_FRAME.x + 1, y: BACK_FRAME.y + (1 / VIS_H) * 100, w: BACK_IMG_W, h: BACK_IMG_H, rot: 3 };

function BackVisual() {
  const pillTop = [6, 33, 60];
  const lines = BACK_CALLOUTS.map((c, i) => ({
    from: [53.5, pillTop[i] + 6.5] as [number, number],
    to: onAd(BACK_AD, c.at.x, c.at.y),
    delay: 460 + i * 160,
  }));
  return (
    <div className="relative h-full w-full">
      <div className="absolute" style={{ left: `${BACK_FRAME.x}%`, top: `${BACK_FRAME.y}%`, width: `${BACK_FRAME.w}%`, height: `${BACK_FRAME_H}%` }}>
        <div className="fc-in rounded-[3.6cqw] bg-[#1a1a1f] p-[1cqw] ring-1 ring-white/20" style={{ rotate: `${BACK_AD.rot}deg`, boxShadow: "0 6cqw 12cqw -5cqw rgba(0,0,0,0.95)", ["--d" as string]: "200ms" }}>
          <AdFrame ad={BUFFY_AD} className="aspect-[9/16] !rounded-[2.8cqw]" sizes="(max-width: 640px) 30vw, 160px" />
        </div>
      </div>
      <Connectors lines={lines} rgb={RED.rgb} />
      {lines.map((l, i) => (
        <Dot key={i} x={l.to[0]} y={l.to[1]} rgb={RED.rgb} delay={l.delay + 420} />
      ))}
      {BACK_CALLOUTS.map((c, i) => (
        <div
          key={c.label}
          className="fc-in-x absolute right-[4%] w-[43%] rounded-[2.4cqw] border px-[2.2cqw] py-[1.8cqw]"
          style={{
            top: `${pillTop[i]}%`,
            borderColor: `rgba(${RED.rgb},0.32)`,
            background: "linear-gradient(180deg, rgba(36,16,24,0.94), rgba(22,11,16,0.94))",
            boxShadow: `0 0 6cqw -2.5cqw rgba(${RED.rgb},0.7)`,
            ["--d" as string]: `${380 + i * 160}ms`,
          }}
        >
          <p className="flex items-center gap-[1.4cqw] text-[max(9px,2.75cqw)] font-medium text-white">
            <AlertCircle className="h-[3.2cqw] w-[3.2cqw] shrink-0" style={{ color: RED.text }} strokeWidth={2.4} />
            {c.label}
          </p>
          <p className="mt-[0.6cqw] text-[max(7.5px,2.25cqw)] leading-snug text-white/55">{c.note}</p>
        </div>
      ))}
      <div className="fc-in absolute bottom-[6%] left-[8%] right-[4%] flex items-center justify-between gap-[2cqw] rounded-full border border-white/[0.08] bg-white/[0.03] px-[3cqw] py-[1.6cqw]" style={{ ["--d" as string]: "1100ms" }}>
        <span className="flex items-center gap-[1.4cqw] text-[max(8px,2.4cqw)] text-white/80">
          <span className="h-[1.8cqw] w-[1.8cqw] rounded-full" style={{ background: `rgb(${RED.rgb})`, boxShadow: `0 0 2cqw rgb(${RED.rgb})` }} />3 issues found
        </span>
        <span className="text-[max(7px,2.1cqw)] text-white/40">Creative-level observations</span>
      </div>
    </div>
  );
}

function LibraryVisual({ active }: { active: boolean }) {
  const [q, setQ] = useState(0);
  const [typed, setTyped] = useState(LIBRARY.queries[0]);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let idx = q;
    let timer = 0;
    const full = () => LIBRARY.queries[idx];
    setTyped("");
    const type = () => {
      i += 1;
      setTyped(full().slice(0, i));
      if (i < full().length) timer = window.setTimeout(type, 55);
      else
        timer = window.setTimeout(() => {
          idx = (idx + 1) % LIBRARY.queries.length;
          setQ(idx);
          i = 0;
          setTyped("");
          timer = window.setTimeout(type, 250);
        }, 1700);
    };
    timer = window.setTimeout(type, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="relative h-full w-full px-[5%] pb-[4.5%]">
      <div
        className="fc-in relative flex h-full flex-col rounded-[3.4cqw] border border-white/[0.09] p-[2.8cqw]"
        style={{ background: "linear-gradient(180deg, rgba(28,24,44,0.95), rgba(14,12,22,0.96))", boxShadow: "0 5cqw 12cqw -5cqw rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)", ["--d" as string]: "200ms" }}
      >
        <div className="flex items-center gap-[1.8cqw] rounded-full border border-white/[0.09] bg-black/30 px-[2.6cqw] py-[1.6cqw]">
          <Search className="h-[3cqw] w-[3cqw] shrink-0 text-white/50" />
          <span className="min-w-0 truncate text-[max(8.5px,2.6cqw)] text-white/80">
            {typed}
            <span className="fc-caret ml-[0.3cqw] inline-block h-[2.6cqw] w-px translate-y-[0.4cqw] bg-brand-light" />
          </span>
        </div>
        <div className="mt-[2cqw] flex gap-[1.2cqw] overflow-hidden">
          {LIBRARY.filters.map((f, i) => (
            <span
              key={f}
              className={`fc-in shrink-0 rounded-full border px-[2cqw] py-[0.8cqw] text-[max(7.5px,2.2cqw)] ${
                i === 0 ? "border-brand/50 bg-brand/25 text-white" : "border-white/[0.08] bg-white/[0.03] text-white/55"
              }`}
              style={{ ["--d" as string]: `${320 + i * 60}ms` }}
            >
              {f}
            </span>
          ))}
        </div>
        <div className="mt-[2.4cqw] grid min-h-0 flex-1 grid-cols-2 gap-[2cqw]">
          {LIBRARY.items.map((it, i) => (
            <div
              key={it.ad.brand}
              className="fc-in group relative overflow-hidden rounded-[2.4cqw] ring-1 ring-white/10"
              style={{ ["--d" as string]: `${520 + i * 120}ms` }}
            >
              <Image src={it.ad.src} alt={it.ad.alt} fill sizes="(max-width: 640px) 36vw, 180px" className="object-cover object-top" draggable={false} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-[1.8cqw] pb-[1.4cqw] pt-[5cqw]">
                <p className="truncate text-[max(8px,2.4cqw)] font-medium text-white">{it.ad.brand}</p>
                <p className="truncate text-[max(7px,2cqw)] text-white/60">
                  {it.ad.category} · {it.approach}
                </p>
              </div>
              {i === 0 && (
                <span
                  className="fc-pop absolute right-[1.6cqw] top-[1.6cqw] flex items-center gap-[0.8cqw] rounded-full bg-brand px-[1.6cqw] py-[0.6cqw] text-[max(7px,2cqw)] font-medium text-white shadow-[0_0_4cqw_rgba(139,92,246,0.8)]"
                  style={{ ["--d" as string]: "1400ms" }}
                >
                  <Bookmark className="h-[2cqw] w-[2cqw]" fill="currentColor" /> Saved
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-[1.8cqw] text-center text-[max(7px,2cqw)] text-white/35">Illustrative examples from the library</p>
      </div>
    </div>
  );
}

/* ───────────────────────── AI Creative Strategy ───────────────────────── */
/* Three benefits, each with a miniature of the real screen it refers to.   */
/* The ads are SVG illustrations for a fictional brand (lib/strategyShowcase). */
function StrategyVisual() {
  const rows = [
    {
      icon: Globe,
      title: "Brand-aware recommendations",
      text: "Build ideas around the available product information, positioning, and visual identity.",
      mini: (
        <div className="flex min-w-0 gap-[1.2cqw]">
          {[DEMO_BRAND.website.replace("https://", ""), DEMO_BRAND.social.replace("https://", "")].map((u) => (
            <span key={u} className="min-w-0 truncate rounded-full border border-white/[0.09] bg-black/30 px-[1.8cqw] py-[0.5cqw] text-[max(7.5px,2.2cqw)] text-white/70">
              {u}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: Lightbulb,
      title: "Creative concepts",
      text: "Explore different hooks, messages, offers, and visual directions.",
      mini: (
        <div className="flex min-w-0 gap-[1.2cqw] overflow-hidden">
          {CONCEPTS.slice(0, 3).map((c, i) => (
            <span
              key={c.angle}
              className={`shrink-0 rounded-full border px-[1.8cqw] py-[0.5cqw] text-[max(7.5px,2.2cqw)] ${i === 1 ? "border-[rgba(217,70,239,0.5)] bg-[rgba(217,70,239,0.16)] text-white" : "border-white/[0.08] bg-white/[0.03] text-white/60"}`}
            >
              {c.angle}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: ImagePlus,
      title: "Ad generation",
      text: "Turn a selected concept into multiple creative variations with suggested copy.",
      mini: (
        <div className="flex items-end gap-[1.4cqw]">
          {AD_VARIANTS.map((v) => (
            <div key={v.ratio} className="overflow-hidden rounded-[1.2cqw] ring-1 ring-white/15" style={{ width: v.ratio === "9:16" ? "7.6cqw" : v.ratio === "1:1" ? "11cqw" : "10.4cqw" }}>
              <AdMock ratio={v.ratio} lines={v.lines} cta={v.cta} />
            </div>
          ))}
          <span className="pb-[0.4cqw] text-[max(7px,2cqw)] text-white/40">Illustration</span>
        </div>
      ),
    },
  ];
  return (
    <div className="relative flex h-full w-full flex-col justify-end gap-[2cqw] px-[5%] pb-[5%]">
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <div
            key={r.title}
            className="fc-in flex gap-[2.6cqw] rounded-[3cqw] border border-white/[0.09] p-[2.6cqw]"
            style={{
              background: "linear-gradient(180deg, rgba(30,22,40,0.94), rgba(15,12,22,0.95))",
              boxShadow: `0 4cqw 9cqw -5cqw rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)`,
              ["--d" as string]: `${240 + i * 160}ms`,
            }}
          >
            <span
              className="flex h-[7cqw] w-[7cqw] shrink-0 items-center justify-center rounded-[2cqw]"
              style={{ background: `rgba(${FUCHSIA.rgb},0.16)`, color: FUCHSIA.text, boxShadow: `inset 0 0 0 1px rgba(${FUCHSIA.rgb},0.3)` }}
            >
              <Icon className="h-[3.8cqw] w-[3.8cqw]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[max(9.5px,2.9cqw)] font-semibold leading-tight text-white">{r.title}</p>
              <p className="mt-[0.6cqw] text-[max(8.5px,2.45cqw)] leading-[1.35] text-white/60">{r.text}</p>
              <div className="mt-[1.4cqw]">{r.mini}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

