"use client";

import { useEffect, useRef } from "react";
import { Check, CheckCircle2, FlaskConical, ScanSearch, Sparkles, Upload } from "lucide-react";
import { HERO_CREATIVE } from "@/lib/demoCreative";
import { StepInfo } from "@/components/marketing/StepInfo";

// ─────────────────────────────────────────────────────────────────────────────
// "How Creatively.ai Works" — a four-step, scroll-driven timeline.
//
// Motion model (no React state on scroll):
//   • one passive scroll listener → requestAnimationFrame
//   • writes --hiw-p (0–1) on the track → the purple line grows / retreats
//   • writes --sp (0–1) on every step → each demo is scrubbed by scroll, so it
//     plays forward when scrolling down and reverses when scrolling up
//   • sets data-state="upcoming|active|done" on each step (nodes + glow)
//
// Every demo uses the same sample creative as the hero (lib/demoCreative), and
// every number is labelled as a sample analysis — nothing here calls the API.
// ─────────────────────────────────────────────────────────────────────────────

const AD = HERO_CREATIVE;
const [GREAT, NOT_GREAT, TO_TEST] = AD.analysis.cards;

const SMOOTHING_MS = 110; // eases the scroll-linked values so motion feels silky

// Sample analysis categories (from the Buffy sample report's signal scores, /10).
const CATEGORIES = [
  { label: "Hook", score: 5 },
  { label: "Visuals", score: 8 },
  { label: "Offer", score: 3 },
  { label: "Messaging", score: 8 },
];

// Where each analysis marker sits on the creative (fractions of the image).
const MARKERS = [
  { label: "Hook", x: 0.5, y: 0.22, tone: "red" },
  { label: "Benefits", x: 0.2, y: 0.5, tone: "green" },
  { label: "Product", x: 0.68, y: 0.45, tone: "green" },
  { label: "CTA", x: 0.5, y: 0.83, tone: "green" },
] as const;

function Window({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`hiw-window ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="h-2 w-2 rounded-full bg-white/[0.07]" />
        <span className="ml-2 text-[11px] font-medium text-ink-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SampleTag({ children = "Sample analysis" }: { children?: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink-muted sm:text-[10px]">
      {children}
    </span>
  );
}

function Cursor() {
  return (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" aria-hidden>
      <path d="M3 2l12.5 9.2-5.6.9 3.2 6.1-2.3 1.2-3.2-6.1L3.6 17z" fill="#fff" stroke="#0a0a0f" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

// ── Step demos ───────────────────────────────────────────────────────────────

function UploadDemo() {
  return (
    <Window label="Creative upload">
      <div className="hiw-up">
        {/* the "file" waiting on the left */}
        <div className="hiw-up-file-label">buffy-ad.png</div>
        {/* drop zone */}
        <div className="hiw-up-drop">
          <div className="hiw-up-drop-hint">
            <Upload className="mx-auto h-[1.15em] w-[1.15em] text-brand-light/80" aria-hidden />
            <p>Drop your ad here</p>
            <p className="text-white/35">PNG or JPG</p>
          </div>
          <div className="hiw-up-progress">
            <div className="hiw-up-progress-bar" />
          </div>
          <div className="hiw-up-done">
            <CheckCircle2 className="h-[1.1em] w-[1.1em] text-accent-green" aria-hidden />
            Uploaded · ready to analyze
          </div>
        </div>
        {/* the thumbnail that gets dragged into the zone, then becomes the preview */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AD.image.src} alt="" className="hiw-up-thumb" loading="lazy" decoding="async" />
        <div className="hiw-up-cursor">
          <Cursor />
        </div>
      </div>
    </Window>
  );
}

function AnalyzeDemo() {
  return (
    <Window label="Creative analysis">
      <div className="hiw-an">
        <div className="hiw-an-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AD.image.src} alt={AD.image.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
          <div className="hiw-an-scan" aria-hidden />
          {MARKERS.map((m, i) => (
            <span
              key={m.label}
              className={`hiw-an-marker ${m.tone === "red" ? "is-red" : ""}`}
              style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, ["--y" as string]: m.y, ["--i" as string]: i }}
            >
              <span className="hiw-an-dot" />
              <span className="hiw-an-label">{m.label}</span>
            </span>
          ))}
        </div>
        <div className="hiw-an-side">
          <div className="hiw-an-score">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span className="text-[0.72em] text-ink-muted">Creative Score</span>
              <SampleTag />
            </div>
            <p className="mt-1 font-semibold text-white">
              <span className="text-[1.9em] leading-none">{AD.report.core.score}</span>
              <span className="text-[0.85em] text-ink-muted">/100</span>
            </p>
            <p className="text-[0.72em] text-orange-300/90">{AD.report.core.verdict_label}</p>
          </div>
          <div className="hiw-an-bars">
            {CATEGORIES.map((c, i) => (
              <div key={c.label} style={{ ["--i" as string]: i, ["--v" as string]: c.score / 10 }}>
                <div className="flex justify-between text-[0.72em]">
                  <span className="text-ink-secondary">{c.label}</span>
                  <span className="text-ink-primary">{c.score}/10</span>
                </div>
                <div className="hiw-bar">
                  <div className="hiw-bar-fill" />
                </div>
              </div>
            ))}
          </div>
          <div className="hiw-an-insight is-green">
            <Check className="h-[1em] w-[1em]" aria-hidden /> {GREAT.findings[0].label}
          </div>
          <div className="hiw-an-insight is-red">
            <span aria-hidden>!</span> {NOT_GREAT.findings[1].label}
          </div>
        </div>
      </div>
    </Window>
  );
}

function ImproveDemo() {
  const cards = [
    { tone: "green", title: "What’s Great", items: GREAT.findings.slice(0, 2) },
    { tone: "red", title: "What’s Not Great", items: NOT_GREAT.findings.slice(0, 2) },
    { tone: "violet", title: "What to Test", items: TO_TEST.findings.slice(0, 2) },
  ] as const;
  return (
    <div className="hiw-im">
      {cards.map((c, i) => (
        <div key={c.title} className={`hiw-im-card is-${c.tone}`} style={{ ["--i" as string]: i }}>
          <div className="flex items-center justify-between gap-2">
            <p className="hiw-im-title">{c.title}</p>
            {i === 0 && <SampleTag />}
          </div>
          <ul className="mt-2 space-y-1.5">
            {c.items.map((f, j) => (
              <li key={f.label} className={`hiw-im-item ${c.tone === "violet" && j === 0 ? "is-highlight" : ""}`}>
                <span className="font-medium text-ink-primary">{f.label}</span>
                <span className="text-ink-muted"> — {f.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TestDemo() {
  const tiles = [
    { label: "Original", note: "As uploaded", variant: "orig" },
    { label: "Variation A", note: "Hook changed", variant: "a" },
    { label: "Variation B", note: "One primary benefit", variant: "b" },
  ] as const;
  return (
    <Window label="Creative tests">
      <div className="hiw-te">
        <div className="hiw-te-row">
          {tiles.map((t, i) => (
            <figure key={t.label} className={`hiw-te-tile is-${t.variant}`} style={{ ["--i" as string]: i }}>
              <div className="hiw-te-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AD.image.src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                {t.variant === "a" && (
                  <div className="hiw-te-patch hiw-te-headline">Make your bed your favorite place.</div>
                )}
                {t.variant === "b" && (
                  <div className="hiw-te-patch hiw-te-benefit">
                    <span className="hiw-te-check">✓</span>
                    Temperature
                    <br />
                    regulating
                  </div>
                )}
              </div>
              <figcaption className="mt-1.5 text-center">
                <span className="block text-[0.78em] font-medium text-ink-primary">{t.label}</span>
                <span className="block text-[0.68em] text-ink-muted">{t.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="hiw-te-compare">
          <span className="is-changed">Hook · changed in A</span>
          <span className="is-changed">Benefits · simplified in B</span>
          <span>Visual & offer · unchanged</span>
        </div>
        <p className="hiw-te-note">
          Example concept variations. Test results depend on your audience, campaign setup, and
          real-world performance.
        </p>
      </div>
    </Window>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    kicker: "Upload your creative",
    icon: Upload,
    title: "Start with your ad creative.",
    body: "Upload an image creative and let Creatively.ai examine the elements behind your message.",
    info: { title: "Upload", text: "Start with an image ad creative you want to understand or improve." },
    Demo: UploadDemo,
  },
  {
    n: "02",
    kicker: "Analyze the creative",
    icon: ScanSearch,
    title: "Understand what’s behind your ad.",
    body: "Evaluate your hook, visuals, offer, messaging, and call to action to identify potential strengths and weaknesses.",
    info: { title: "Analyze", text: "Review the elements that influence how your creative communicates its message." },
    Demo: AnalyzeDemo,
  },
  {
    n: "03",
    kicker: "Improve what matters",
    icon: Sparkles,
    title: "Find out what to improve.",
    body: "Get actionable recommendations that help you refine your message, strengthen your creative, and identify what may be holding it back.",
    info: { title: "Improve", text: "Turn the analysis into specific, practical ideas for your next creative iteration." },
    Demo: ImproveDemo,
  },
  {
    n: "04",
    kicker: "Test and learn",
    icon: FlaskConical,
    title: "Turn insights into your next test.",
    body: "Use the recommendations to develop creative variations, test them with your audience, and learn from actual campaign results.",
    info: { title: "Test", text: "Compare creative variations using actual campaign results to learn what performs best." },
    Demo: TestDemo,
  },
];

export function HowItWorks() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const steps = Array.from(track.querySelectorAll<HTMLElement>(".hiw-step"));
    const nodes = steps.map((s) => s.querySelector<HTMLElement>(".hiw-node")!);
    const line = track.querySelector<HTMLElement>(".hiw-line")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Line geometry (relative to the track), refreshed on resize.
    let lineTop = 0;
    let lineLen = 1;
    const layout = () => {
      const t = track.getBoundingClientRect().top;
      const first = nodes[0].getBoundingClientRect();
      const last = nodes[nodes.length - 1].getBoundingClientRect();
      lineTop = first.top + first.height / 2 - t;
      lineLen = Math.max(1, last.top + last.height / 2 - (first.top + first.height / 2));
      line.style.top = `${lineTop}px`;
      line.style.height = `${lineLen}px`;
    };

    const target = { p: 0, sp: steps.map(() => 0) };
    const shown: { p: number; sp: number[] } = { p: 0, sp: steps.map(() => (reduced ? 1 : 0)) };
    const states: string[] = steps.map(() => "");

    const read = () => {
      const vh = window.innerHeight;
      const anchor = vh * 0.55; // the "reading line" the timeline follows
      const trackTop = track.getBoundingClientRect().top;
      target.p = Math.min(1, Math.max(0, (anchor - (trackTop + lineTop)) / lineLen));
      let active = -1;
      steps.forEach((s, i) => {
        const r = nodes[i].getBoundingClientRect();
        if (r.top + r.height / 2 <= anchor) active = i;
        // 0 when the step's top is low in the viewport → 1 by the time it's in the upper-middle
        const top = s.getBoundingClientRect().top;
        target.sp[i] = reduced ? 1 : Math.min(1, Math.max(0, (vh * 0.9 - top) / (vh * 0.55)));
      });
      steps.forEach((s, i) => {
        const st = i < active ? "done" : i === active ? "active" : "upcoming";
        if (states[i] !== st) {
          states[i] = st;
          s.dataset.state = st;
        }
      });
    };

    const write = () => {
      track.style.setProperty("--hiw-p", shown.p.toFixed(4));
      steps.forEach((s, i) => s.style.setProperty("--sp", shown.sp[i].toFixed(4)));
    };

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      read();
      const k = reduced ? 1 : 1 - Math.exp(-dt / SMOOTHING_MS);
      let moving = false;
      shown.p += (target.p - shown.p) * k;
      if (Math.abs(target.p - shown.p) > 0.0005) moving = true;
      else shown.p = target.p;
      shown.sp = shown.sp.map((v, i) => {
        const d = target.sp[i] - v;
        if (Math.abs(d) > 0.0008) {
          moving = true;
          return v + d * k;
        }
        return target.sp[i];
      });
      write();
      raf = moving ? requestAnimationFrame(frame) : 0;
      if (!moving) last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    layout();
    read();
    if (reduced) {
      shown.p = target.p;
    }
    write();
    kick();

    const ro = new ResizeObserver(() => {
      layout();
      kick();
    });
    ro.observe(track);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, []);

  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="hiw relative scroll-mt-24 overflow-hidden border-t border-white/5 px-5 py-24 sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] max-w-[160vw] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.10), transparent 75%)" }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-brand-light/80">How it works</p>
        <h2 id="hiw-title" className="mt-4 text-3xl font-semibold tracking-tight text-ink-primary sm:text-[44px] sm:leading-[1.1]">
          How Creatively.ai Works
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
          From creative upload to actionable insights. Understand what works, what holds your ad back,
          and what to test next.
        </p>
      </div>

      <div ref={trackRef} className="hiw-track relative mx-auto mt-16 max-w-6xl sm:mt-20">
        {/* the line: dark rail + purple fill that follows scroll (and retreats) */}
        <div className="hiw-line" aria-hidden>
          <div className="hiw-line-fill" />
          <div className="hiw-line-head" />
        </div>

        <ol className="space-y-24 sm:space-y-32">
          {STEPS.map((s) => (
            <li key={s.n} className="hiw-step" data-state="upcoming">
              <span className="hiw-node" aria-hidden>
                <Check className="hiw-node-check" strokeWidth={3} />
              </span>
              <div className="hiw-step-grid">
                <div className="hiw-copy">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-light/85">
                    <span className="text-ink-muted">Step {s.n}</span>
                    <span className="h-px w-4 bg-white/15" />
                    {s.kicker}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink-primary sm:text-[30px] sm:leading-[1.15]">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">{s.body}</p>
                  <StepInfo title={s.info.title} text={s.info.text} step={s.n} />
                </div>
                <div className="hiw-demo">
                  <s.Demo />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
