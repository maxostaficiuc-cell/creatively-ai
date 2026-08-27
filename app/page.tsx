import {
  Sparkles,
  ArrowRight,
  Check,
  Upload,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PricingCards } from "@/app/pricing/PricingCards";
import { ScoreCounter } from "@/components/marketing/ScoreCounter";
import { DashboardShowcase } from "@/components/marketing/DashboardShowcase";
import { GetFreeReportButton } from "@/components/marketing/GetFreeReportButton";
import { LiveActivityStats } from "@/components/marketing/LiveActivityStats";

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
  { slug: "demo-creative-1", imageUrl: "/winning-ads/creative-1.png", score: 91 },
  { slug: "demo-creative-2", imageUrl: "/winning-ads/creative-2.png", score: 92 },
  { slug: "demo-creative-3", imageUrl: "/winning-ads/creative-3.png", score: 97 },
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
            <GetFreeReportButton className="px-7 py-3.5 text-base">
              Get Your Free Report <ArrowRight size={16} />
            </GetFreeReportButton>
            <ButtonLink href="#winning-ads" variant="secondary" className="px-7 py-3.5 text-base">
              Explore Winning Ads
            </ButtonLink>
          </div>
        </div>

        {/* HERO PRODUCT SHOWCASE */}
        <div className="mt-20 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <DashboardShowcase
            label="The Creatively.ai Workspace"
            caption="Analyze creatives, understand performance, and turn your advertising data into your next decision."
          />
        </div>
      </section>

      {/* LIVE ACTIVITY — real aggregate data, not scripted numbers */}
      <section className="border-t border-white/5 px-6 py-16">
        <LiveActivityStats />
      </section>

      {/* TRUST-BUILDING PRODUCT PROOF */}
      <section id="features" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
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
            <div className="group relative rounded-2xl border border-brand/40 bg-base-card p-7 shadow-glow transition-transform duration-300 ease-out hover:-translate-y-1">
              <div
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] opacity-60 blur-2xl animate-pulse"
                style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.28), transparent)" }}
              />
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
      <section id="creative-analysis" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              Upload an ad. We&apos;ll tell you exactly what&apos;s wrong.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Get an immediate breakdown of your creative before you commit more budget to it.
            </p>
          </div>

          <div className="mt-14 rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-14 text-center">
            <p className="text-sm text-ink-secondary">
              Upload your ad and get a full creative intelligence report — score, strengths,
              priority fixes, and exactly what to test next.
            </p>
            <GetFreeReportButton className="mt-6 px-7 py-3.5 text-base">
              Get Your Free Report
            </GetFreeReportButton>
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
      <section id="winning-ads" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              See what&apos;s working.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Explore example creative analyses and see what makes strong ads different.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {winningAds.map((ad) => (
              <Link
                key={ad.slug}
                href={`/report/${ad.slug}`}
                className="group block cursor-pointer overflow-hidden rounded-2xl border border-base-border bg-base-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow"
              >
                <div className="overflow-hidden bg-black">
                  <img
                    src={ad.imageUrl}
                    alt=""
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/40 text-xs font-semibold text-brand-light">
                      <ScoreCounter value={ad.score} />
                    </span>
                    <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs text-accent-green">
                      Example Creative
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                    <span>Meta Ads · Static</span>
                    <span className="text-brand-light opacity-0 transition-opacity group-hover:opacity-100">
                      View Analysis →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM DASHBOARD SHOWCASE */}
      <section className="border-t border-white/5 px-6 py-24">
        <p className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
          This is the actual software you&apos;re getting.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center text-ink-secondary">
          Overview, Analyze Creative, Winning Ads, My Creatives, Campaigns, Ad Sets, Ads,
          Insights — one workspace, no separate tools to stitch together.
        </p>
        <div className="mt-14">
          <DashboardShowcase />
        </div>
      </section>

      {/* AI INSIGHTS INTO ACTION */}
      <section id="insights" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
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
      <section id="how-it-works" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
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
      <section id="integrations" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
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
      <section id="pricing" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
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
      <section id="faq" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
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
          <GetFreeReportButton className="px-7 py-3.5 text-base">
            Get Your Free Report <ArrowRight size={16} />
          </GetFreeReportButton>
          <ButtonLink href="#winning-ads" variant="secondary" className="px-7 py-3.5 text-base">
            Explore Winning Ads
          </ButtonLink>
        </div>
      </section>

      <Footer />
    </>
  );
}
