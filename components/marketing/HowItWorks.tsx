"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Check, Globe, ImagePlus, Lightbulb, ScanSearch } from "lucide-react";
import { HERO_CREATIVE } from "@/lib/demoCreative";
import { AD_VARIANTS, CONCEPTS, DEMO_BRAND, PROGRESS_STEPS, SELECTED_CONCEPT, SNAPSHOT, SUGGESTED_COPY } from "@/lib/strategyShowcase";
import { StepInfo } from "@/components/marketing/StepInfo";
import { TrialCallout } from "@/components/marketing/TrialButton";
import { AdMock } from "@/components/marketing/strategy/AdMock";
import { AnalyzeButton, ConceptCard, IllustrationTag, SnapshotRow, UrlField } from "@/components/marketing/strategy/Mocks";

// ─────────────────────────────────────────────────────────────────────────────
// "How Creatively.ai Works" — a four-step, scroll-driven timeline:
// Brand → Strategy → Creation → Analysis.
//
// Motion model (no React state on scroll):
//   • one passive scroll listener → requestAnimationFrame
//   • writes --hiw-p (0–1) on the track → the purple line grows / retreats
//   • writes --sp (0–1) on every step → each demo is scrubbed by scroll, so it
//     plays forward when scrolling down and reverses when scrolling up
//   • sets data-state="upcoming|active|done" on each step (nodes + glow)
//
// Steps 1–3 illustrate Creative Strategy with a fictional brand (lib/strategyShowcase)
// and are labelled as illustrations. Step 4 uses the same sample creative as the
// hero (lib/demoCreative), labelled as a sample analysis. Nothing calls the API.
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

const FLOW = ["Brand", "Strategy", "Creation", "Analysis"];

function Window({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`hiw-window ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="h-2 w-2 rounded-full bg-white/[0.07]" />
        <span className="ml-2 truncate text-[11px] font-medium text-ink-muted">{label}</span>
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

// ── Step demos ───────────────────────────────────────────────────────────────

function BrandDemo() {
  return (
    <Window label="Creative Strategy · New brand analysis">
      <div className="hiw-br">
        <UrlField kind="web" label="Website URL" value={DEMO_BRAND.website} valueClassName="hiw-br-type hiw-br-t1" />
        <UrlField kind="social" label="Social media profile URL" value={DEMO_BRAND.social} valueClassName="hiw-br-type hiw-br-t2" className="mt-[0.85em]" />
        <div className="mt-[1em] flex flex-wrap items-center justify-between gap-[0.6em]">
          <AnalyzeButton className="hiw-br-btn" />
          <span className="text-[0.74em] text-ink-muted">Website, profile, or both</span>
        </div>
        <ul className="mt-[1.1em] space-y-[0.5em]">
          {PROGRESS_STEPS.slice(0, 3).map((t, i) => (
            <li key={t} className="hiw-br-step" style={{ ["--i" as string]: i }}>
              <span className="hiw-br-check">
                <Check className="h-[0.75em] w-[0.75em]" strokeWidth={3} aria-hidden />
              </span>
              {t}
            </li>
          ))}
        </ul>
        <p className="hiw-br-note">Public pages only. If a profile can&apos;t be read, paste its bio or add screenshots instead.</p>
      </div>
    </Window>
  );
}

function StrategyDemo() {
  return (
    <Window label={`Creative Strategy · ${DEMO_BRAND.name}`}>
      <div className="hiw-st">
        <div className="hiw-st-col">
          <div className="mb-[0.6em] flex items-center justify-between gap-2">
            <p className="text-[0.78em] font-semibold text-ink-primary">Brand snapshot</p>
            <IllustrationTag />
          </div>
          <div className="space-y-[0.45em]">
            {SNAPSHOT.map((r, i) => (
              <SnapshotRow key={r.label} {...r} className="hiw-st-row" style={{ ["--i" as string]: i }} />
            ))}
          </div>
        </div>
        <div className="hiw-st-col">
          <p className="mb-[0.6em] text-[0.78em] font-semibold text-ink-primary">Recommended ad concepts</p>
          <div className="space-y-[0.45em]">
            {CONCEPTS.map((c, i) => (
              <ConceptCard key={c.name} {...c} selected={i === SELECTED_CONCEPT} className="hiw-st-con" style={{ ["--i" as string]: i }} />
            ))}
          </div>
        </div>
      </div>
      <p className="hiw-st-note">Built only from what the website and profile show. Anything missing is marked “Needs confirmation”.</p>
    </Window>
  );
}

function GenerateDemo() {
  const concept = CONCEPTS[SELECTED_CONCEPT];
  return (
    <Window label={`Generate ads · ${concept.name}`}>
      <div className="hiw-ge">
        <div className="flex flex-wrap items-center gap-[0.45em]">
          <span className="rounded-full border border-brand/50 bg-brand/[0.15] px-[0.7em] py-[0.2em] text-[0.72em] font-medium text-brand-light">{concept.angle}</span>
          <span className="rounded-full border border-white/10 px-[0.7em] py-[0.2em] text-[0.72em] text-ink-secondary">3 variations</span>
          <IllustrationTag className="ml-auto">Illustration · fictional brand</IllustrationTag>
        </div>
        <div className="hiw-ge-row">
          {AD_VARIANTS.map((v, i) => (
            <figure key={v.ratio} className="hiw-ge-tile" style={{ ["--i" as string]: i }}>
              <div className="hiw-ge-media">
                <AdMock ratio={v.ratio} lines={v.lines} cta={v.cta} />
                <span className="hiw-ge-skeleton" aria-hidden />
              </div>
              <figcaption className="mt-[0.35em] text-center text-[0.72em] text-ink-muted">{v.ratio}</figcaption>
            </figure>
          ))}
        </div>
        <dl className="hiw-ge-copy">
          {[
            ["Headline", SUGGESTED_COPY.headline],
            ["Primary text", SUGGESTED_COPY.primary],
            ["Call to action", SUGGESTED_COPY.cta],
          ].map(([k, v], i) => (
            <div key={k} style={{ ["--i" as string]: i }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
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
          <div className="hiw-an-insight is-violet">
            <ArrowRight className="h-[1em] w-[1em]" aria-hidden /> Test: {TO_TEST.findings[0].label}
          </div>
        </div>
      </div>
    </Window>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    kicker: "Add your brand",
    icon: Globe,
    title: "Start with your brand.",
    body: "Paste your website, your social media profile, or both. Creatively.ai uses the available information to understand your products, positioning, messaging, and visual identity.",
    info: {
      title: "Add your brand",
      text: "Paste a website URL, a social profile URL, or both. Only publicly available pages are read. If a profile is private or can’t be loaded, you can paste its bio or add screenshots instead.",
    },
    Demo: BrandDemo,
  },
  {
    n: "02",
    kicker: "Discover your strategy",
    icon: Lightbulb,
    title: "Find your next creative angle.",
    body: "Get tailored advertising recommendations based on your brand, audience, offers, and messaging. Discover ideas worth testing instead of starting from a blank page.",
    info: {
      title: "Discover your strategy",
      text: "Recommendations depend on what your sources actually show. Each detail is marked Verified, Inferred, or Needs confirmation, and you can correct anything before choosing a concept.",
    },
    Demo: StrategyDemo,
  },
  {
    n: "03",
    kicker: "Generate your ads",
    icon: ImagePlus,
    title: "Turn ideas into creatives.",
    body: "Choose an advertising concept and generate multiple visual variations with suggested headlines, copy, and calls to action.",
    info: {
      title: "Generate your ads",
      text: "Pick a concept and a format (1:1, 4:5 or 9:16) to generate static image variations with suggested copy. Each generated image uses credits from your plan. Review every ad before you run it.",
    },
    Demo: GenerateDemo,
  },
  {
    n: "04",
    kicker: "Analyze and improve",
    icon: ScanSearch,
    title: "Keep making smarter creative decisions.",
    body: "Analyze existing ads, understand their strengths and weaknesses, and use the insights to decide what to improve or test next.",
    info: {
      title: "Analyze and improve",
      text: "Upload an image ad to get a score, evidence-based findings, and recommendations. The score is a guide to the creative itself, not a prediction of campaign results.",
    },
    Demo: AnalyzeDemo,
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
          From your brand to your next ad. Understand your brand, find the right angle, create ads,
          and keep improving them with analysis.
        </p>
        <ol className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] font-medium text-ink-secondary" aria-label="Workflow">
          {FLOW.map((f, i) => (
            <li key={f} data-reveal className="flex items-center gap-2" style={{ ["--d" as string]: i }}>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{f}</span>
              {i < FLOW.length - 1 && <ArrowRight size={13} className="text-brand-light/70" aria-hidden />}
            </li>
          ))}
        </ol>
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

      <TrialCallout
        className="relative mt-24 sm:mt-28"
        title="Ready to improve your next creative?"
        label="Start Your Trial — $1"
        placement="how-it-works"
      />
    </section>
  );
}
