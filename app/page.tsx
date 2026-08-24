import {
  Sparkles,
  ArrowRight,
  Check,
  Upload,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PricingCards } from "@/app/pricing/PricingCards";
import { ScoreCounter } from "@/components/marketing/ScoreCounter";

const scoreBreakdown = [
  { label: "Hook", value: 91 },
  { label: "Visual", value: 84 },
  { label: "Offer", value: 89 },
  { label: "CTA", value: 76 },
  { label: "Clarity", value: 92 },
  { label: "Conversion Potential", value: 83 },
];

const honestExamples = [
  { score: 94, verdict: "Strong — ready to test", tone: "green" as const },
  { score: 67, verdict: "Promising — needs improvement", tone: "orange" as const },
  { score: 38, verdict: "Weak — fix before spending", tone: "red" as const },
];

const winningAds = [
  { title: "DETAILING THAT PROTECTS YOUR INVESTMENT", score: 91, platform: "Meta Ads", format: "Static" },
  { title: "KEEP YOUR YACHT LOOKING BRAND NEW", score: 88, platform: "Meta Ads", format: "Video" },
  { title: "HYDRATION THAT HITS DIFFERENT", score: 84, platform: "Meta Ads", format: "UGC" },
];

const howItWorks = [
  { n: "01", title: "Upload", body: "Upload your image or video." },
  { n: "02", title: "Analyze", body: "Creatively.ai evaluates the creative across key advertising factors." },
  { n: "03", title: "Improve", body: "Understand what's working, what's not, and what to test next." },
  { n: "04", title: "Measure", body: "Connect your advertising account and compare creative intelligence with actual performance." },
];

const audiences = [
  { title: "Media Buyers", body: "Know which creatives deserve more attention." },
  { title: "Agencies", body: "Analyze creatives across clients and campaigns." },
  { title: "Brands", body: "Stop guessing why your ads underperform." },
];

const faqs = [
  {
    q: "What does Creatively.ai analyze?",
    a: "Currently, image ad creatives — Creatively.ai evaluates hook strength, visual hierarchy, offer clarity, messaging, and CTA effectiveness, then gives you a score and specific feedback. Video analysis is on the roadmap.",
  },
  {
    q: "How does the creative score work?",
    a: "The AI evaluates your creative across factors like hook, visual hierarchy, offer, CTA clarity, and conversion potential, then combines them into a single 0–100 score along with written feedback on what's working and what to change.",
  },
  {
    q: "Is the score a guarantee of performance?",
    a: "No. The score is a diagnostic signal based on creative best practices, not a guarantee of real-world ad performance — actual results depend on audience, offer, platform, and more.",
  },
  {
    q: "Can I connect my Meta Ads account?",
    a: "Yes. Connecting Meta Ads unlocks real spend, CTR, and performance data alongside your creative analysis.",
  },
  {
    q: "Are TikTok and Google Ads available?",
    a: "Not yet — both are coming soon. Meta Ads is the only live integration right now.",
  },
  {
    q: "Do I need an ad account to analyze creative?",
    a: "No. You can upload and analyze creatives without connecting any advertising account.",
  },
  {
    q: "How do AI credits work?",
    a: "Each plan includes a weekly AI credit allowance that resets every 7 days. Analyzing an image costs 100 credits, a video costs 500. You can also buy additional credits without changing plans.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your Billing page at any time — your access continues through the end of your current billing period.",
  },
  {
    q: "Is my advertising data private?",
    a: "Yes. Your uploaded creatives, analysis results, and connected account data are private to your account and protected by database-level access rules — see our Data & Security page for details.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] opacity-40"
          style={{
            background:
              "radial-gradient(700px circle at 50% 0%, rgba(139,92,246,0.22), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-base-border bg-base-card px-4 py-1.5 text-xs text-ink-secondary">
            <Sparkles size={13} className="text-brand-light" />
            AI CREATIVE INTELLIGENCE FOR ADVERTISERS
          </div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink-primary sm:text-6xl">
            Know what&apos;s wrong with your ad before you spend money on it.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-secondary">
            Creatively.ai analyzes your advertising creative, identifies what&apos;s working,
            exposes what&apos;s hurting performance, and tells you what to test next.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/signup" className="px-7 py-3.5 text-base">
              Get Started <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="#winning-ads" variant="secondary" className="px-7 py-3.5 text-base">
              Explore Winning Ads
            </ButtonLink>
          </div>
        </div>

        {/* HERO PRODUCT SHOWCASE */}
        <div className="mx-auto mt-20 max-w-5xl animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <p className="text-center text-xs font-medium uppercase tracking-wide text-brand-light">
            The Creatively.ai Workspace
          </p>
          <div className="group relative mt-6">
            <div
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.35), transparent)" }}
            />
            <div className="overflow-hidden rounded-2xl border border-base-border bg-base-card shadow-glow transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:brightness-110">
              {/* Save your real dashboard screenshot to public/dashboard-screenshot.png
                  and it will appear here automatically. */}
              <img
                src="/dashboard-screenshot.png"
                alt="The Creatively.ai dashboard"
                className="w-full"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 -bottom-10 h-24"
              style={{ background: "linear-gradient(to bottom, transparent, #0A0A0D)" }}
            />
          </div>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink-secondary">
            Analyze creatives, understand performance, and turn your advertising data into your
            next decision.
          </p>
        </div>
      </section>

      {/* TRUST-BUILDING PRODUCT PROOF */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            See exactly what you get.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            No vague promises. Your dashboard is where creative analysis, advertising performance,
            and recommendations come together.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-4">
            {["Creative Analysis", "Performance Overview", "Winning Creatives", "Creative Intelligence"].map(
              (label) => (
                <div key={label} className="rounded-xl border border-base-border bg-base-card p-5">
                  <p className="text-sm font-medium text-ink-primary">{label}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* BEFORE YOU SPEND */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              Don&apos;t wait until you&apos;ve spent money to discover your creative was the
              problem.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Most advertisers know when an ad is underperforming. The difficult part is knowing
              what to change before wasting more budget.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-base-border bg-base-card p-7">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Without Creatively.ai
              </p>
              <ul className="mt-5 space-y-3">
                {["Launch", "Spend", "Wait", "Guess what's wrong", "Change something", "Repeat"].map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-brand/40 bg-base-card p-7 shadow-glow">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-light">
                With Creatively.ai
              </p>
              <ul className="mt-5 space-y-3">
                {["Upload", "Analyze", "Understand", "Improve", "Test", "Measure"].map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-ink-primary">
                    <Check size={14} className="text-accent-green" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CREATIVE ANALYSIS CENTERPIECE */}
      <section id="creative-analysis" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              Upload an ad. We&apos;ll tell you exactly what&apos;s wrong.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Get an immediate breakdown of your creative before you commit more budget to it.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-5">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-10 text-center lg:col-span-2">
              <Upload className="text-brand-light" size={26} />
              <p className="mt-3 text-sm text-ink-secondary">
                Drag and drop an image or video
                <br />
                or click to upload
              </p>
              <span className="mt-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand/40 text-lg font-semibold text-brand-light">
                <ScoreCounter value={87} />
              </span>
              <p className="mt-2 text-xs text-ink-muted">/ 100</p>
            </div>

            <div className="grid gap-4 lg:col-span-3">
              <div className="flex gap-3 rounded-xl border border-base-border bg-base-card p-5">
                <TrendingUp size={16} className="mt-0.5 shrink-0 text-accent-green" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent-green">
                    What&apos;s great
                  </p>
                  <p className="mt-1.5 text-sm text-ink-secondary">
                    Strong visual hierarchy, clear product presentation, strong brand consistency.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-base-border bg-base-card p-5">
                <TrendingDown size={16} className="mt-0.5 shrink-0 text-accent-red" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent-red">
                    What&apos;s not great
                  </p>
                  <p className="mt-1.5 text-sm text-ink-secondary">
                    Headline explains the product but not the strongest benefit; CTA lacks urgency;
                    no clear differentiating offer.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-base-border bg-base-card p-5">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-light" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-light">
                    What you could improve
                  </p>
                  <p className="mt-1.5 text-sm text-ink-secondary">
                    Strengthen the opening hook, make the offer more specific, add social proof,
                    test a stronger CTA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCORE EXPLANATION */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              A score that tells you where the creative stands.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Creatively.ai evaluates the elements that influence attention, clarity, persuasion,
              and conversion potential.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-base-border bg-base-card p-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-secondary">Creative Score</p>
              <p className="text-2xl font-semibold text-ink-primary">
                <ScoreCounter value={87} />
                <span className="text-base text-ink-muted"> / 100</span>
              </p>
            </div>
            <div className="mt-6 space-y-4">
              {scoreBreakdown.map((s) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-ink-secondary">{s.label}</span>
                    <span className="text-ink-primary">{s.value}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-ink-muted">
            The score is a diagnostic tool — not a guarantee of performance.
          </p>
        </div>
      </section>

      {/* BRUTALLY HONEST SCORING */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              Not every creative deserves your budget.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              A beautiful ad can still be a weak ad. Creatively.ai is designed to tell you when a
              creative needs work.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {honestExamples.map((ex) => {
              const toneClass =
                ex.tone === "green"
                  ? "border-accent-green/40 text-accent-green"
                  : ex.tone === "orange"
                  ? "border-orange-400/40 text-orange-400"
                  : "border-accent-red/40 text-accent-red";
              return (
                <div key={ex.score} className="rounded-2xl border border-base-border bg-base-card p-7 text-center">
                  <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border text-xl font-semibold ${toneClass}`}>
                    <ScoreCounter value={ex.score} />
                  </span>
                  <p className="mt-4 text-sm font-medium text-ink-primary">{ex.verdict}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-xs text-ink-muted">Example AI evaluations</p>
        </div>
      </section>

      {/* WINNING ADS LIBRARY */}
      <section id="winning-ads" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              See what&apos;s working.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Explore winning creative patterns and understand what makes strong ads different.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {winningAds.map((ad) => (
              <div
                key={ad.title}
                className="group overflow-hidden rounded-2xl border border-base-border bg-base-card transition-colors hover:border-brand/40"
              >
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-base-surface to-base-card px-6 text-center text-sm font-semibold uppercase tracking-tight text-ink-primary transition-transform duration-500 group-hover:scale-[1.03]">
                  {ad.title}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/40 text-xs font-semibold text-brand-light">
                      {ad.score}
                    </span>
                    <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs text-accent-green">
                      Example Creative
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                    <span>{ad.platform} · {ad.format}</span>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      View Analysis →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECOND PRODUCT SHOWCASE */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Everything you need to understand your creative.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Creatively.ai brings creative analysis and advertising intelligence into one workspace.
          </p>
          <div className="mt-14 overflow-hidden rounded-2xl border border-base-border bg-base-card shadow-glow">
            <img src="/dashboard-screenshot.png" alt="Creatively.ai workspace" className="w-full" />
          </div>
          <div className="mt-10 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Creative Analysis", body: "Understand what's working and what isn't." },
              { title: "Performance Overview", body: "See spend, revenue, and ROAS once your ad account is connected." },
              { title: "Winning Creatives", body: "Understand which creatives stand out." },
              { title: "Creative Intelligence", body: "Turn analysis into actionable next steps." },
            ].map((f) => (
              <div key={f.title}>
                <p className="text-sm font-medium text-ink-primary">{f.title}</p>
                <p className="mt-1.5 text-sm text-ink-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI INSIGHTS INTO ACTION */}
      <section id="insights" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            AI insights organized into action.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-base-border bg-base-card p-6">
              <TrendingUp className="text-accent-green" size={20} />
              <h3 className="mt-4 font-medium text-ink-primary">Creatives to Scale</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Identify strong creatives worth pushing further.
              </p>
            </div>
            <div className="rounded-2xl border border-base-border bg-base-card p-6">
              <TrendingDown className="text-accent-red" size={20} />
              <h3 className="mt-4 font-medium text-ink-primary">Creatives to Review</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Find underperforming creatives that may need attention.
              </p>
            </div>
            <div className="rounded-2xl border border-base-border bg-base-card p-6">
              <Sparkles className="text-brand-light" size={20} />
              <h3 className="mt-4 font-medium text-ink-primary">Tests Worth Running</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Get AI-identified opportunities for your next creative iteration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            From upload to insight in four steps.
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s) => (
              <div key={s.n}>
                <span className="text-sm font-medium text-brand-light">{s.n}</span>
                <h3 className="mt-3 text-lg font-medium text-ink-primary">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL ADVERTISING DATA / INTEGRATIONS */}
      <section id="integrations" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Bring your real advertising data into the picture.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Connect your advertising platforms and combine creative intelligence with actual
            campaign performance.
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6">
            <div className="animate-logo-loop flex items-center gap-2 rounded-full border border-brand/40 bg-base-card px-6 py-3 text-sm text-ink-primary">
              Meta Ads
            </div>
            <div
              className="animate-logo-loop flex items-center gap-2 rounded-full border border-base-border bg-base-card px-6 py-3 text-sm text-ink-muted opacity-60"
              style={{ animationDelay: "1.5s" }}
            >
              TikTok Ads <span className="text-[10px] uppercase">Coming Soon</span>
            </div>
            <div
              className="animate-logo-loop flex items-center gap-2 rounded-full border border-base-border bg-base-card px-6 py-3 text-sm text-ink-muted opacity-60"
              style={{ animationDelay: "3s" }}
            >
              Google Ads <span className="text-[10px] uppercase">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* PERFORMANCE INTELLIGENCE */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            See your creative and your performance in the same picture.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Once your Meta Ads account is connected, Creatively.ai can combine creative
            intelligence with real advertising data.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-ink-secondary">
            {["Creative Score", "Spend", "CTR", "Revenue", "ROAS"].map((label, i) => (
              <span key={label} className="flex items-center gap-3">
                <span className="rounded-full border border-base-border bg-base-card px-4 py-2">
                  {label}
                </span>
                {i < 4 && <span className="text-ink-muted">·</span>}
              </span>
            ))}
          </div>
          <p className="mt-8 text-lg font-medium text-ink-primary">Better creative decisions</p>
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Most analytics tools tell you what happened. Creatively.ai helps you understand why.
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-base-border bg-base-card p-7">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Traditional Ad Analytics
              </p>
              <ul className="mt-5 space-y-2.5">
                {["Spend", "Clicks", "CTR", "Conversions", "ROAS"].map((f) => (
                  <li key={f} className="text-sm text-ink-secondary">{f}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-brand/40 bg-base-card p-7 shadow-glow">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-light">
                Creatively.ai
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Creative diagnosis",
                  "Creative score",
                  "Strengths",
                  "Weaknesses",
                  "Testing recommendations",
                  "Creative comparisons",
                  "Creative intelligence",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-primary">
                    <Check size={13} className="text-accent-green" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Simple plans that scale with your creative intelligence.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Start small, unlock deeper analysis as you grow, and scale your creative intelligence
            when your advertising operation demands it.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-6xl">
          <PricingCards />
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Built for people who spend money on ads.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="text-center">
                <h3 className="font-medium text-ink-primary">{a.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-ink-primary">
            Frequently asked questions
          </h2>
          <div className="mt-12 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-base-border bg-base-card p-5">
                <summary className="cursor-pointer list-none text-sm font-medium text-ink-primary marker:content-['']">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-ink-secondary">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-white/5 px-6 py-28 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
          Know before you spend.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
          Analyze your creative before you commit more budget to it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink href="/signup" className="px-7 py-3.5 text-base">
            Get Started <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink href="#winning-ads" variant="secondary" className="px-7 py-3.5 text-base">
            Explore Winning Ads
          </ButtonLink>
        </div>
      </section>

      <Footer />
    </>
  );
}
