"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, AlertCircle, Lightbulb, Users, ChevronLeft, ChevronRight, Check, BedDouble, Tag, ArrowDownRight } from "lucide-react";
import { HERO_CREATIVE, type DemoCreative } from "@/lib/demoCreative";

/*
 * "What every report gives you" — four tilted glass cards you swipe through
 * (arrows on desktop, swipe on touch). Each card illustrates one part of a real
 * Creatively.ai report using the SAME Buffy example as the hero: the score and
 * signal values, weaknesses, test ideas and audience hypotheses all come from
 * `HERO_CREATIVE`, so nothing here can contradict the hero or the full report.
 */

type Slide = {
  id: string;
  icon: typeof BarChart3;
  iconBg: string;
  title: [string, string];
  body: string;
  Visual: (props: { creative: DemoCreative }) => JSX.Element;
};

const SLIDES: Slide[] = [
  {
    id: "working",
    icon: BarChart3,
    iconBg: "linear-gradient(145deg,#A78BFA,#7C3AED)",
    title: ["Spot what's", "working."],
    body: "Get a clear breakdown of what your ad does well — and why it works.",
    Visual: WorkingVisual,
  },
  {
    id: "holding-back",
    icon: AlertCircle,
    iconBg: "linear-gradient(145deg,#FB7185,#E11D48)",
    title: ["Find what's holding", "your ad back."],
    body: "See the weaknesses and missed opportunities before you spend budget on them.",
    Visual: HoldingBackVisual,
  },
  {
    id: "test-next",
    icon: Lightbulb,
    iconBg: "linear-gradient(145deg,#C4B5FD,#8B5CF6)",
    title: ["Get clear ideas of", "what to test next."],
    body: "Turn every weakness into a specific creative test — what to change, and what to keep.",
    Visual: TestNextVisual,
  },
  {
    id: "audience",
    icon: Users,
    iconBg: "linear-gradient(145deg,#60A5FA,#4F46E5)",
    title: ["Reach the right", "audience."],
    body: "Get audience hypotheses and positioning angles to test with your ad.",
    Visual: AudienceVisual,
  },
];

const TILT = [-2.2, 1.8, -1.6, 2.2];

export function AnalysisTourCarousel({ creative = HERO_CREATIVE }: { creative?: DemoCreative }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // which card is closest to the centre of the track
  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
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
    setActive(best);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncActive);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    syncActive();
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [syncActive]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const el = cardRefs.current[i];
    if (!track || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="tour-title" className="tour-section relative overflow-hidden bg-[#08080B] pb-20 pt-6 sm:pb-28">
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
          Shown with the {creative.brand} ad from above — the same analysis you can open in full.
        </p>
      </div>

      {/* track */}
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="What a Creatively.ai report includes"
        className="tour-track relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain py-8 sm:gap-6"
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
              aria-label={`${i + 1} of ${SLIDES.length}: ${s.title.join(" ")}`}
              className="tour-card relative shrink-0 snap-center"
              style={{
                transform: `rotate(${isActive ? TILT[i] * 0.45 : TILT[i]}deg) scale(${isActive ? 1 : 0.93})`,
                opacity: isActive ? 1 : 0.5,
              }}
              onClick={() => !isActive && goTo(i)}
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
                <div className="flex flex-col items-center text-center">
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
                <div className="relative mt-5 flex-1 sm:mt-6">
                  <s.Visual creative={creative} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* controls */}
      <div className="relative mx-auto flex w-[var(--tour-card-w)] max-w-full items-center justify-between gap-4 px-1">
        <p className="text-[11px] text-white/35">{creative.analysis.disclaimer}</p>
        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            aria-label="Previous"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white transition-colors hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 disabled:opacity-30"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={active === SLIDES.length - 1}
            onClick={() => goTo(active + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white transition-colors hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 disabled:opacity-30"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── visuals ───────────────────────── */

function AdThumb({ creative, className = "", style }: { creative: DemoCreative; className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={creative.image.src}
      alt=""
      aria-hidden
      width={creative.image.width}
      height={creative.image.height}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`block h-full w-auto rounded-[14px] object-contain shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] ring-1 ring-white/10 ${className}`}
      style={style}
    />
  );
}

const BAR_COLORS = ["#22C55E", "#A78BFA", "#F59E0B", "#60A5FA", "#F472B6"];

function WorkingVisual({ creative }: { creative: DemoCreative }) {
  const core = creative.report.core;
  // the strongest signals — the "what's working" side of the score
  const strengths = [...core.signal_scores].sort((a, b) => b.score - a.score).slice(0, 5);
  const score = creative.report.scoreOutOf10;
  const firstStrength = creative.analysis.cards[0].findings[0].label;
  const arc = Math.PI * 34; // semicircle length for r=34

  return (
    <div className="flex h-full items-stretch justify-center gap-3 sm:gap-4">
      <div className="h-[clamp(190px,46vw,270px)] -rotate-[3deg]">
        <AdThumb creative={creative} />
      </div>
      <div className="relative flex w-[min(58%,250px)] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 sm:p-4">
        <span className="absolute -right-2 -top-3 inline-flex items-center gap-1 rounded-full border border-accent-green/30 bg-[#0F1A14] px-2 py-0.5 text-[10px] font-medium text-[#4ADE80] shadow-[0_0_20px_-6px_rgba(34,197,94,0.7)] sm:text-[11px]">
          <Check size={11} strokeWidth={3} /> {firstStrength}
        </span>
        <p className="text-[10.5px] font-medium text-white/70 sm:text-[12px]">Creative score</p>
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
          {strengths.map((s, i) => (
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

// short callout lines for the three most visible weaknesses, and where they sit on the ad (fractions of its height)
const WEAKNESS_CALLOUTS = [
  { label: "Generic headline", short: "Doesn’t say why Buffy is different.", y: 0.24, x: 0.95 },
  { label: "Unsupported benefit claims", short: "Benefits aren’t backed up in the ad.", y: 0.5, x: 0.06 },
  { label: "No visible offer", short: "No clear incentive to buy now.", y: 0.8, x: 0.78 },
];

function HoldingBackVisual({ creative }: { creative: DemoCreative }) {
  const labels = new Set(creative.analysis.cards[1].findings.map((f) => f.label));
  const callouts = WEAKNESS_CALLOUTS.filter((c) => labels.has(c.label));
  return (
    <div className="relative mx-auto flex h-[clamp(190px,46vw,270px)] max-w-[420px] items-stretch gap-3">
      <div className="relative h-full shrink-0">
        <AdThumb creative={creative} className="grayscale-[45%]" />
        {callouts.map((c) => (
          <span
            key={c.label}
            aria-hidden
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F43F5E] shadow-[0_0_0_4px_rgba(244,63,94,0.25),0_0_14px_rgba(244,63,94,0.9)]"
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
          />
        ))}
      </div>
      {/* connector lines + callouts */}
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

function TestNextVisual({ creative }: { creative: DemoCreative }) {
  const hook = creative.report.hook.alternatives[0].text; // “Make your bed your favorite place.”
  return (
    <div className="relative mx-auto flex h-[clamp(200px,48vw,280px)] max-w-[460px] items-end justify-center">
      {/* lifestyle */}
      <div className="relative z-0 -mr-3 w-[32%] -rotate-[6deg] overflow-hidden rounded-[16px] border border-white/10 bg-[#141220] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]">
        <div
          className="flex aspect-[4/5] items-center justify-center"
          style={{ background: "linear-gradient(160deg,#F4EFE6 0%,#E5DED3 55%,#CFC6BA 100%)" }}
        >
          <BedDouble className="h-1/3 w-1/3 text-[#8A7F72]" strokeWidth={1.4} />
        </div>
        <div className="p-2 sm:p-2.5">
          <p className="text-[10px] font-medium text-white sm:text-[11.5px]">Lifestyle creative</p>
          <p className="text-[8.5px] leading-snug text-white/55 sm:text-[10px]">The product in a real bedroom setting.</p>
        </div>
      </div>
      {/* stronger hook — concept over the real ad */}
      <div className="relative z-10 w-[38%] overflow-hidden rounded-[16px] border border-brand/40 bg-[#141220] shadow-[0_24px_50px_-20px_rgba(139,92,246,0.55)]">
        <div className="relative aspect-[4/5] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={creative.image.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[50%_42%]" />
          <div className="absolute inset-x-[6%] top-[8%] rounded-md bg-[#DCE8F3]/95 px-1.5 py-1 text-center font-serif text-[9px] leading-tight text-[#1F3B4D] shadow sm:text-[11px]">
            {hook.replace(/[“”]/g, "")}
          </div>
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] text-white/80 sm:text-[9px]">Concept</span>
        </div>
        <div className="p-2 sm:p-2.5">
          <p className="text-[10px] font-medium text-white sm:text-[11.5px]">Stronger hook</p>
          <p className="text-[8.5px] leading-snug text-white/55 sm:text-[10px]">A more product-specific headline.</p>
        </div>
      </div>
      {/* offer-led — only with a real offer */}
      <div className="relative z-0 -ml-3 w-[32%] rotate-[6deg] overflow-hidden rounded-[16px] border border-white/10 bg-[#141220] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 border-b border-dashed border-white/15 bg-white/[0.03] p-2 text-center">
          <Tag className="h-6 w-6 text-amber-300/80 sm:h-7 sm:w-7" strokeWidth={1.6} />
          <p className="text-[9px] font-medium text-white/80 sm:text-[10.5px]">Your real offer here</p>
        </div>
        <div className="p-2 text-right sm:p-2.5">
          <p className="text-[10px] font-medium text-white sm:text-[11.5px]">Offer-led variant</p>
          <p className="text-[8.5px] leading-snug text-white/55 sm:text-[10px]">Only if a genuine offer exists.</p>
        </div>
      </div>
    </div>
  );
}

const AUDIENCE_SHORT = ["Sleep comfort & bedding", "Bedroom refresh", "Home décor & comfort", "Gift shoppers"];

function AudienceVisual({ creative }: { creative: DemoCreative }) {
  const audiences = creative.report.audiences.slice(0, 4);
  const angle = "Position around comfort and better rest.";
  return (
    <div className="relative mx-auto max-w-[440px]">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 sm:p-4">
        <p className="text-[11px] font-medium text-white/80 sm:text-[12.5px]">
          Recommended audiences <span className="text-white/45">(to test)</span>
        </p>
        <ul className="mt-2.5 divide-y divide-white/[0.05]">
          {audiences.map((a, i) => (
            <li key={a.name} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] text-white/70">{i + 1}</span>
                <span className="truncate text-[11.5px] text-white/85 sm:text-[13px]">{AUDIENCE_SHORT[i] ?? a.name}</span>
              </span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] sm:text-[10.5px] ${
                  i < 2 ? "border-brand/40 bg-brand/15 text-brand-light" : "border-sky-400/30 bg-sky-400/10 text-sky-300"
                }`}
              >
                {i < 2 ? "Test first" : "Also test"}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative ml-auto mt-3 w-[74%] rounded-xl border border-white/[0.09] bg-[#15131B] p-2.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] sm:-mt-6 sm:mr-[-14px] sm:w-[56%] sm:p-3">
        <ArrowDownRight aria-hidden className="absolute -left-5 -top-4 hidden h-5 w-5 text-brand-light/70 sm:block" />
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-white sm:text-[12.5px]">
          <BarChart3 size={13} className="text-brand-light" /> Audience angle
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-white/60 sm:text-[11.5px]">{angle}</p>
      </div>
    </div>
  );
}
