"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  AlertCircle,
  Lightbulb,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  FlaskConical,
  Pause,
  Play,
} from "lucide-react";
import { HERO_CREATIVE } from "@/lib/demoCreative";
import {
  BLISSY_AD,
  BLISSY_WORKING,
  PIQUE_AD,
  PIQUE_ANGLE,
  PIQUE_AUDIENCES,
  RIPTIDE_AD,
  RIPTIDE_KEEP,
  RIPTIDE_TESTS,
  TOUR_DISCLAIMER,
  type TourAd,
} from "@/lib/tourExamples";

/*
 * "Inside every report" — four tilted glass cards, each showing one part of a
 * Creatively.ai report on a DIFFERENT real ad (Blissy, Buffy, Riptide, Pique).
 *
 * Plays by itself (story-style progress bar, ~5s per card, loops) so visitors
 * can just watch; pauses on hover / focus / when off-screen; swipe on touch,
 * drag with the mouse, arrows, or tap a progress segment to jump.
 */

const AUTOPLAY_MS = 5200;
const RESUME_AFTER_INTERACTION_MS = 9000;

const BUFFY_AD: TourAd = {
  brand: HERO_CREATIVE.brand,
  category: "Bedding",
  src: HERO_CREATIVE.image.src,
  width: HERO_CREATIVE.image.width,
  height: HERO_CREATIVE.image.height,
  alt: HERO_CREATIVE.image.alt,
};

type Slide = {
  id: string;
  ad: TourAd;
  icon: typeof BarChart3;
  iconBg: string;
  title: [string, string];
  body: string;
  Visual: () => JSX.Element;
};

const SLIDES: Slide[] = [
  {
    id: "working",
    ad: BLISSY_AD,
    icon: BarChart3,
    iconBg: "linear-gradient(145deg,#A78BFA,#7C3AED)",
    title: ["Spot what's", "working."],
    body: "Get a clear breakdown of what your ad does well — and why it works.",
    Visual: WorkingVisual,
  },
  {
    id: "holding-back",
    ad: BUFFY_AD,
    icon: AlertCircle,
    iconBg: "linear-gradient(145deg,#FB7185,#E11D48)",
    title: ["Find what's holding", "your ad back."],
    body: "See the weaknesses and missed opportunities before you spend budget on them.",
    Visual: HoldingBackVisual,
  },
  {
    id: "test-next",
    ad: RIPTIDE_AD,
    icon: Lightbulb,
    iconBg: "linear-gradient(145deg,#C4B5FD,#8B5CF6)",
    title: ["Get clear ideas of", "what to test next."],
    body: "Turn every weakness into a specific creative test — what to change, and what to keep.",
    Visual: TestNextVisual,
  },
  {
    id: "audience",
    ad: PIQUE_AD,
    icon: Users,
    iconBg: "linear-gradient(145deg,#60A5FA,#4F46E5)",
    title: ["Reach the right", "audience."],
    body: "Get audience hypotheses and positioning angles to test with your ad.",
    Visual: AudienceVisual,
  },
];

const TILT = [-2.2, 1.8, -1.6, 2.2];

export function AnalysisTourCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [holdUntil, setHoldUntil] = useState(0); // after a manual interaction, wait longer
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
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
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
      track.scrollTo({
        left: el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [reduced]
  );

  const manual = (fn: () => void) => {
    setHoldUntil(Date.now() + RESUME_AFTER_INTERACTION_MS);
    fn();
  };

  // ── autoplay: advance after AUTOPLAY_MS (longer after a manual interaction), loop ──
  useEffect(() => {
    if (!playing) return;
    const wait = Math.max(AUTOPLAY_MS, holdUntil - Date.now());
    const t = window.setTimeout(() => goTo(active + 1), wait);
    return () => clearTimeout(t);
  }, [playing, active, holdUntil, goTo]);

  // ── mouse drag (touch already swipes natively) ──
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
      track.style.scrollBehavior = "auto";
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
    track.style.scrollBehavior = "";
    track.style.cursor = "";
    manual(() => goTo(nearestIndex()));
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="tour-title"
      className="tour-section relative overflow-hidden bg-[#08080B] pb-20 pt-6 sm:pb-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] max-w-[140vw] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.13), transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brand-light/90">Inside every report</p>
        <h2 id="tour-title" className="mt-3 text-balance text-[clamp(26px,3.6vw,42px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
          One upload. A complete creative breakdown.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-[#9A9AA5]">
          Four real ads, four parts of every report — see what Creatively.ai pulls out of a single creative.
        </p>
      </div>

      {/* track */}
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="What a Creatively.ai report includes"
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
        className="tour-track relative mt-10 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain py-8 sm:gap-6"
      >
        {SLIDES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          return (
            <div
              key={s.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${s.title.join(" ")} — example: ${s.ad.brand}`}
              className="tour-card relative shrink-0 snap-center select-none"
              style={{
                transform: `rotate(${isActive ? TILT[i] * 0.45 : TILT[i]}deg) scale(${isActive ? 1 : 0.93})`,
                opacity: isActive ? 1 : 0.5,
              }}
              onClick={() => {
                if (suppressClick.current) return;
                if (!isActive) manual(() => goTo(i));
              }}
            >
              <div
                className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.09] p-5 sm:p-7"
                style={{
                  background: "linear-gradient(180deg, rgba(24,22,34,0.92) 0%, rgba(13,12,19,0.96) 100%)",
                  boxShadow: isActive
                    ? "0 40px 90px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(167,139,250,0.10), 0 0 60px -30px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 30px 70px -40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/40 to-transparent" />
                {/* which ad this card is about */}
                <span className="absolute left-4 top-4 inline-flex max-w-[60%] items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/60 sm:left-5 sm:top-5 sm:text-[11px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-light" />
                  <span className="truncate">
                    {s.ad.brand} · {s.ad.category}
                  </span>
                </span>
                <div className="flex flex-col items-center pt-7 text-center sm:pt-5">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[12px] text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.7)] sm:h-12 sm:w-12"
                    style={{ background: s.iconBg }}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-4 text-[clamp(21px,2.4vw,28px)] font-semibold leading-[1.12] tracking-[-0.015em] text-white">
                    {s.title[0]}{" "}
                    <span className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] bg-clip-text text-transparent">{s.title[1]}</span>
                  </h3>
                  <p className="mt-2 max-w-[400px] text-[13.5px] leading-relaxed text-[#A1A1AC] sm:text-[14.5px]">{s.body}</p>
                </div>
                <div className="relative mt-5 flex flex-1 items-center sm:mt-6">
                  <div className="w-full">
                    <s.Visual />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* story-style progress + controls */}
      <div className="relative mx-auto w-[var(--tour-card-w)] max-w-full px-1">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Choose a card">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`${s.title.join(" ")} (${s.ad.brand})`}
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
                        ? {
                            animationDuration: `${Math.max(AUTOPLAY_MS, holdUntil - Date.now())}ms`,
                            animationPlayState: playing ? "running" : "paused",
                          }
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

/* ───────────────────────── visuals ───────────────────────── */

function AdImage({ ad, className = "", sizes = "200px" }: { ad: TourAd; className?: string; sizes?: string }) {
  return (
    <Image
      src={ad.src}
      alt={ad.alt}
      width={ad.width}
      height={ad.height}
      sizes={sizes}
      draggable={false}
      className={`block h-full w-auto rounded-[14px] object-contain shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] ring-1 ring-white/10 ${className}`}
    />
  );
}

const BAR_COLORS = ["#22C55E", "#A78BFA", "#F59E0B", "#60A5FA", "#F472B6"];

function WorkingVisual() {
  const { score, signals, highlight } = BLISSY_WORKING;
  const arc = Math.PI * 34;
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <div className="w-[40%] max-w-[210px] shrink-0 -rotate-[3deg]">
        <AdImage ad={BLISSY_AD} className="!h-auto w-full" sizes="(max-width: 640px) 36vw, 210px" />
      </div>
      <div className="relative flex w-[min(58%,250px)] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 sm:p-4">
        <span className="absolute -top-3 right-0 inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-accent-green/30 bg-[#0F1A14] px-2 py-0.5 text-[9.5px] font-medium text-[#4ADE80] shadow-[0_0_20px_-6px_rgba(34,197,94,0.7)] sm:-right-2 sm:text-[11px]">
          <Check size={11} strokeWidth={3} /> {highlight}
        </span>
        <p className="mt-1 text-[10.5px] font-medium text-white/70 sm:text-[12px]">Creative score</p>
        <div className="relative mt-1 flex justify-center">
          <svg viewBox="0 0 80 46" className="w-[clamp(88px,22vw,120px)]" aria-hidden>
            <path d="M6 40 A34 34 0 0 1 74 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M6 40 A34 34 0 0 1 74 40"
              fill="none"
              stroke="url(#tour-gauge)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${(arc * score) / 10} ${arc}`}
            />
            <defs>
              <linearGradient id="tour-gauge" x1="0" x2="1">
                <stop offset="0" stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>
          <p className="absolute bottom-0 text-[15px] font-semibold text-white sm:text-[18px]">
            {score.toFixed(1)}
            <span className="text-[10px] text-white/50 sm:text-[11px]">/10</span>
          </p>
        </div>
        <ul className="mt-2 flex-1 space-y-1.5 sm:space-y-2">
          {signals.map((s, i) => (
            <li key={s.label}>
              <div className="flex items-center justify-between text-[9.5px] text-white/70 sm:text-[11px]">
                <span className="truncate">{s.label}</span>
                <span className="ml-2 text-white/90">{s.score.toFixed(1)}</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, background: BAR_COLORS[i] }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// three most visible Buffy weaknesses, marked on empty background next to what they refer to
const WEAKNESS_CALLOUTS = [
  { label: "Generic headline", short: "Doesn’t say why Buffy is different.", y: 0.24, x: 0.95 },
  { label: "Unsupported benefit claims", short: "Benefits aren’t backed up in the ad.", y: 0.5, x: 0.06 },
  { label: "No visible offer", short: "No clear incentive to buy now.", y: 0.8, x: 0.78 },
];

function HoldingBackVisual() {
  const labels = new Set(HERO_CREATIVE.analysis.cards[1].findings.map((f) => f.label));
  const callouts = WEAKNESS_CALLOUTS.filter((c) => labels.has(c.label));
  return (
    <div className="relative mx-auto flex h-[clamp(190px,46vw,270px)] max-w-[420px] items-stretch gap-3">
      <div className="relative h-full shrink-0">
        <AdImage ad={BUFFY_AD} className="grayscale-[45%]" sizes="(max-width: 640px) 26vw, 150px" />
        {callouts.map((c) => (
          <span
            key={c.label}
            aria-hidden
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F43F5E] shadow-[0_0_0_4px_rgba(244,63,94,0.25),0_0_14px_rgba(244,63,94,0.9)]"
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
          />
        ))}
      </div>
      <div className="relative flex-1">
        {callouts.map((c) => (
          <div key={c.label} className="absolute inset-x-0 -translate-y-1/2" style={{ top: `${c.y * 100}%` }}>
            <div className="flex items-center">
              <span aria-hidden className="h-px w-3 shrink-0 bg-gradient-to-r from-[#F43F5E] to-[#F43F5E]/40 sm:w-5" />
              <div className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#15131B]/95 px-2.5 py-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)] sm:px-3 sm:py-2">
                <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-white sm:text-[12.5px]">
                  <AlertCircle size={12} className="shrink-0 text-[#F43F5E]" /> {c.label}
                </p>
                <p className="mt-0.5 hidden text-[9.5px] leading-snug text-white/55 min-[440px]:block sm:text-[11px]">{c.short}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestNextVisual() {
  return (
    <div className="mx-auto flex max-w-[460px] items-center gap-3 sm:gap-4">
      <div className="w-[38%] shrink-0 -rotate-[3deg]">
        <AdImage ad={RIPTIDE_AD} className="!h-auto w-full" sizes="(max-width: 640px) 34vw, 180px" />
      </div>
      <div className="min-w-0 flex-1">
        <ul className="space-y-2">
          {RIPTIDE_TESTS.map((t, i) => (
            <li
              key={t.title}
              className="rounded-xl border border-brand/25 bg-brand/[0.06] px-2.5 py-2 shadow-[0_10px_30px_-14px_rgba(139,92,246,0.5)] sm:px-3"
            >
              <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-white sm:text-[12.5px]">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/30 text-[9px] text-brand-light">
                  {i + 1}
                </span>
                <FlaskConical size={12} className="shrink-0 text-brand-light" />
                {t.title}
              </p>
              <p className="mt-0.5 text-[9.5px] leading-snug text-white/55 sm:text-[11px]">{t.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[9.5px] text-[#4ADE80]/80 sm:text-[11px]">{RIPTIDE_KEEP}</p>
      </div>
    </div>
  );
}

function AudienceVisual() {
  return (
    <div className="relative mx-auto flex max-w-[460px] items-center gap-3">
      <div className="hidden w-[30%] shrink-0 rotate-[3deg] min-[400px]:block">
        <AdImage ad={PIQUE_AD} className="!h-auto w-full" sizes="150px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 sm:p-3.5">
          {/* small screens: the ad rides on the panel's corner instead of sitting beside it */}
          <div className="absolute -top-9 right-2 w-[54px] rotate-[5deg] min-[400px]:hidden">
            <AdImage ad={PIQUE_AD} className="!h-auto w-full !rounded-[8px]" sizes="60px" />
          </div>
          <p className="text-[11px] font-medium text-white/80 sm:text-[12px]">
            Audiences <span className="text-white/45">(to test)</span>
          </p>
          <ul className="mt-2 divide-y divide-white/[0.05]">
            {PIQUE_AUDIENCES.map((a) => (
              <li key={a.name} className="flex items-center justify-between gap-2 py-1.5 sm:py-2">
                <span className="min-w-0 truncate text-[11px] text-white/85 sm:text-[12.5px]">{a.name}</span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] ${
                    a.tag === "Test first" ? "border-brand/40 bg-brand/15 text-brand-light" : "border-sky-400/30 bg-sky-400/10 text-sky-300"
                  }`}
                >
                  {a.tag}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2.5 rounded-xl border border-white/[0.09] bg-[#15131B] p-2.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] sm:p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-white sm:text-[12px]">
            <BarChart3 size={13} className="text-brand-light" /> Audience angle
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-white/60 sm:text-[11px]">{PIQUE_ANGLE}</p>
        </div>
      </div>
    </div>
  );
}
