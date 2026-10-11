import {
  Sparkles,
  ArrowRight,
  Check,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PricingCards } from "@/app/pricing/PricingCards";
import { ScoreCounter } from "@/components/marketing/ScoreCounter";
import { ScoreRing } from "@/components/marketing/ScoreRing";
import { DashboardShowcase } from "@/components/marketing/DashboardShowcase";
import { HeroScrollSequence } from "@/components/hero/HeroScrollSequence";
import { FeatureCarousel } from "@/components/marketing/FeatureCarousel";
import { GetFreeReportButton } from "@/components/marketing/GetFreeReportButton";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { PlatformsTicker } from "@/components/marketing/PlatformsTicker";
import { TrialButton, TrialCallout } from "@/components/marketing/TrialButton";
import { STARTER_TRIAL, TRIAL_TERMS } from "@/lib/starterTrial";
import { WinningAdsShowcase } from "@/components/marketing/WinningAdsShowcase";
import { getShowcaseCreatives } from "@/lib/showcaseServer";

// Re-check the showcase table every 5 minutes so admin uploads appear
// on the public homepage without a redeploy.
export const revalidate = 300;

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

export default async function LandingPage() {
  const showcase = await getShowcaseCreatives();
  return (
    <>
      <Nav />
      <ScrollReveal />

      {/* CINEMATIC HERO — hand + phone + scroll-driven example analysis */}
      <HeroScrollSequence />

      {/* FEATURE CAROUSEL — four premium cards: what's working, ad accounts, what's holding it back, winning ads */}
      <FeatureCarousel />
      {STARTER_TRIAL.enabled && (
        <div className="bg-[#08080B] px-6 pb-20 sm:pb-24">
          <TrialCallout title="Turn creative insights into your next test." label="Start for $1" placement="features" />
        </div>
      )}

      {/* HOW IT WORKS — scroll-driven four-step timeline (nav "How It Works" target) */}
      <HowItWorks />

      {/* AD PLATFORMS TICKER + LIVE ANALYSES COUNT (real number from /api/public-stats) */}
      <PlatformsTicker />

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

          <div data-reveal className="mt-14 rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-14 text-center transition-colors duration-300 hover:border-brand/40">
            <p className="text-sm text-ink-secondary">
              Upload your ad and get a full creative intelligence report — score, strengths,
              priority fixes, and exactly what to test next.
            </p>
            <GetFreeReportButton className="mt-6 px-7 py-3.5 text-base">
              Get Your Free Report
            </GetFreeReportButton>
          </div>

          <TrialCallout
            className="mt-14"
            title="See what your next ad could improve."
            label="Try the Analyzer for $1"
            placement="analyzer"
          />
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

          <div data-reveal className="mt-12 rounded-2xl border border-base-border bg-base-card p-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-secondary">Creative Score</p>
              <p className="text-2xl font-semibold text-ink-primary">
                <ScoreCounter value={87} />
                <span className="text-base text-ink-muted"> / 100</span>
              </p>
            </div>
            <div className="mt-6 space-y-4">
              {scoreBreakdown.map((s, i) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-ink-secondary">{s.label}</span>
                    <span className="text-ink-primary">{s.value}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-border">
                    <div
                      data-reveal-bar
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                      style={{ width: `${s.value}%`, ["--d" as string]: i }}
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
            {honestExamples.map((ex, i) => {
              const toneClass =
                ex.tone === "green"
                  ? "border-accent-green/40 text-accent-green"
                  : ex.tone === "orange"
                  ? "border-orange-400/40 text-orange-400"
                  : "border-accent-red/40 text-accent-red";
              return (
                <div
                  key={ex.score}
                  data-reveal
                  style={{ ["--d" as string]: i }}
                  className="rounded-2xl border border-base-border bg-base-card p-7 text-center transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-white/15"
                >
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

      {/* KNOW WHAT MAKES AN AD WORK — cinematic rotating showcase */}
      <WinningAdsShowcase items={showcase.items} demo={showcase.demo} />

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
            {winningAds.map((ad, i) => (
              <Link
                key={ad.slug}
                data-reveal
                style={{ ["--d" as string]: i }}
                href={`/report/${ad.slug}`}
                className="group block cursor-pointer overflow-hidden rounded-2xl border border-base-border bg-base-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow"
              >
                <div data-reveal-sweep className="relative overflow-hidden bg-black">
                  <img
                    src={ad.imageUrl}
                    alt=""
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <ScoreRing score={ad.score} size={40} showLabel={false} />
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

          <TrialCallout
            className="mt-16"
            title="Explore what's possible with Creatively.ai."
            label="Get Started for $1"
            placement="winning-ads"
          />
        </div>
      </section>

      {/* PREMIUM DASHBOARD SHOWCASE — also the footer's "Integrations" target (campaign / ad set / ad views) */}
      <section id="integrations" className="scroll-mt-24 border-t border-white/5 px-6 py-24">
        <p className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
          This is the actual software you&apos;re getting.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center text-ink-secondary">
          Overview, Analyze Creative, Winning Ads, My Creatives, Campaigns, Ad Sets, Ads,
          Insights — one workspace, no separate tools to stitch together.
        </p>
        <div data-reveal className="mt-14">
          <DashboardShowcase />
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Most analytics tools tell you what happened. Creatively.ai helps you understand why.
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div data-reveal className="rounded-2xl border border-base-border bg-base-card p-7">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Traditional Ad Analytics
              </p>
              <ul className="mt-5 space-y-2.5">
                {["Spend", "Clicks", "CTR", "Conversions", "ROAS"].map((f) => (
                  <li key={f} className="text-sm text-ink-secondary">{f}</li>
                ))}
              </ul>
            </div>
            <div data-reveal style={{ ["--d" as string]: 1 }} className="rounded-2xl border border-brand/40 bg-base-card p-7 shadow-glow">
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
      <section id="pricing" className="relative scroll-mt-24 overflow-hidden border-t border-white/5 px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 h-[480px] w-[900px] max-w-[160vw] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.09), transparent 75%)" }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Simple plans that scale with your creative intelligence.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Start small, unlock deeper analysis as you grow, and scale your creative intelligence
            when your advertising operation demands it.
          </p>
        </div>
        <div className="relative mx-auto mt-14 max-w-6xl">
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
            {audiences.map((a, i) => (
              <div key={a.title} data-reveal style={{ ["--d" as string]: i }} className="text-center">
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
            {faqs.map((f, i) => (
              <details
                key={f.q}
                data-reveal
                style={{ ["--d" as string]: Math.min(i, 4) * 0.6 }}
                className="group rounded-xl border border-base-border bg-base-card p-5 transition-colors duration-200 hover:border-white/15 open:border-brand/30"
              >
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
      {STARTER_TRIAL.enabled ? (
        <section className="relative overflow-hidden border-t border-white/5 px-6 py-28 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[760px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.16), transparent 75%)" }}
          />
          <div data-reveal className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-[44px] sm:leading-[1.1]">
              Your next creative deserves a better plan.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
              Find opportunities to improve your ads with actionable creative analysis.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <TrialButton placement="final" size="lg">
                Try 7 Days for $1
              </TrialButton>
              <GetFreeReportButton variant="secondary" className="!h-[52px] !rounded-full !px-6">
                Get Your Free Report
              </GetFreeReportButton>
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              Then ${STARTER_TRIAL.renewalPrice}/month. Review the terms before checkout.
            </p>
          </div>
        </section>
      ) : (
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
      )}

      <Footer />
    </>
  );
}
