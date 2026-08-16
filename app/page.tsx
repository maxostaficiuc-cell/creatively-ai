import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { ButtonLink } from "@/components/ui/Button";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  Check,
  Upload,
  BarChart3,
  Zap,
  ShieldCheck,
} from "lucide-react";

const problems = [
  {
    title: "You're guessing which creatives work",
    body: "Spend is split across dozens of ads with no clear signal on what's actually driving results.",
  },
  {
    title: "Insights arrive too late",
    body: "By the time a report tells you an ad underperformed, the budget is already spent.",
  },
  {
    title: "No system for what to test next",
    body: "Creative testing happens on gut feel instead of a repeatable, data-backed process.",
  },
];

const howItWorks = [
  {
    step: "Connect",
    title: "Connect your ad accounts",
    body: "Link Meta, TikTok or Google Ads — or upload creatives manually to get started.",
  },
  {
    step: "Analyze",
    title: "Let AI analyze every creative",
    body: "Creatively.ai scores each ad and explains what's working and what isn't.",
  },
  {
    step: "Act",
    title: "Know exactly what to test next",
    body: "Get a prioritized list of creatives to scale, review, or test — backed by data.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Try Creatively.ai with limited analyses.",
    features: ["10 creative analyses / mo", "1 connected ad account", "Winning Ads library access"],
    cta: "Start Free Trial",
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    description: "For media buyers and growing brands.",
    features: [
      "Unlimited creative analyses",
      "3 connected ad accounts",
      "Full Creative Intelligence suite",
      "Priority AI processing",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Agency",
    price: "Custom",
    period: "",
    description: "For agencies managing multiple clients.",
    features: [
      "Unlimited accounts & clients",
      "Team seats & permissions",
      "White-label reporting",
      "Dedicated support",
    ],
    cta: "Talk to Sales",
  },
];

const faqs = [
  {
    q: "What platforms does Creatively.ai connect to?",
    a: "Meta, TikTok and Google Ads. Connect one or all three to bring your real performance data into your creative analysis.",
  },
  {
    q: "Do I need to run ads already to use Creatively.ai?",
    a: "No. You can upload creatives for AI analysis even before you connect an ad account or launch a campaign.",
  },
  {
    q: "How does the AI analysis work?",
    a: "Upload an image or video and Creatively.ai evaluates it against creative and performance patterns to surface what's working, what's not, and what to test next.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — Starter and Pro plans are month-to-month with no lock-in.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(139,92,246,0.25), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-base-border bg-base-card px-4 py-1.5 text-xs text-ink-secondary">
            <Sparkles size={14} className="text-brand-light" />
            AI Creative Intelligence for Performance Marketers
          </div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink-primary sm:text-6xl">
            Create better ads.
            <br />
            Backed by data.
            <br />
            <span className="bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-secondary">
            Analyze your creatives, discover winning ads, understand what&apos;s working,
            identify what&apos;s failing, and know exactly what to test next.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/signup" className="px-7 py-3.5 text-base">
              Start Free Trial <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="#winning-ads" variant="secondary" className="px-7 py-3.5 text-base">
              Explore Winning Ads
            </ButtonLink>
          </div>
        </div>

        {/* Product preview */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="rounded-2xl border border-base-border bg-base-card/60 p-2 shadow-glow">
            <div className="rounded-xl border border-base-border bg-base-surface p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {[
                  { label: "Ad Spend", value: "$12,482", delta: "+18.6%" },
                  { label: "ROAS", value: "4.82x", delta: "+22.8%" },
                  { label: "CTR", value: "3.21%", delta: "+8.7%" },
                  { label: "Conversions", value: "184", delta: "+15.2%" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-base-border bg-base-card p-4 text-left">
                    <p className="text-xs text-ink-muted">{m.label}</p>
                    <p className="mt-2 text-xl font-semibold text-ink-primary">{m.value}</p>
                    <p className="mt-1 text-xs text-accent-green">{m.delta} vs last 30 days</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">The problem</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Most advertisers are flying blind on creative performance.
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-2xl border border-base-border bg-base-card p-6">
                <h3 className="text-lg font-medium text-ink-primary">{p.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI CREATIVE ANALYZER */}
      <section id="features" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-brand-light">
              AI Creative Analyzer
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              Upload an ad. Get an instant, data-backed verdict.
            </h2>
            <p className="mt-4 text-ink-secondary">
              Drop in an image or video and Creatively.ai breaks down hook strength,
              visual clarity, messaging, and predicted performance — then tells you
              precisely what to test next.
            </p>
            <ul className="mt-6 space-y-3">
              {["Creative scoring out of 100", "Hook & messaging breakdown", "Suggested next tests"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <Check size={16} className="text-accent-green" /> {f}
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-base-border bg-base-card p-8">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-base-border bg-base-surface py-14 text-center">
              <Upload className="text-brand-light" size={28} />
              <p className="text-sm text-ink-secondary">
                Drag and drop an image or video
                <br />
                or click to upload
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WINNING ADS LIBRARY */}
      <section id="winning-ads" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">
            Winning Ads Library
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            See what&apos;s working across thousands of live ads.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { title: "DETAILING THAT PROTECTS YOUR INVESTMENT", tag: "Automotive · Meta" },
              { title: "KEEP YOUR YACHT LOOKING BRAND NEW", tag: "Marine · Meta" },
              { title: "HYDRATION THAT HITS DIFFERENT", tag: "CPG · TikTok" },
            ].map((c) => (
              <div
                key={c.title}
                className="group overflow-hidden rounded-2xl border border-base-border bg-base-card"
              >
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-base-surface to-base-card px-6 text-center text-sm font-semibold uppercase tracking-tight text-ink-primary">
                  {c.title}
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs text-ink-muted">{c.tag}</span>
                  <span className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs text-accent-green">
                    Winning
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREATIVE INTELLIGENCE */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">
            Creative Intelligence
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            AI insights, organized into action.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-base-border bg-base-card p-6">
              <TrendingUp className="text-accent-green" size={20} />
              <h3 className="mt-4 font-medium text-ink-primary">Creatives to Scale</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Ads significantly outperforming your account average, flagged to scale.
              </p>
            </div>
            <div className="rounded-2xl border border-base-border bg-base-card p-6">
              <BarChart3 className="text-accent-red" size={20} />
              <h3 className="mt-4 font-medium text-ink-primary">Creatives to Review</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Ads consuming spend without strong results — reviewed before you cut them.
              </p>
            </div>
            <div className="rounded-2xl border border-base-border bg-base-card p-6">
              <Zap className="text-brand-light" size={20} />
              <h3 className="mt-4 font-medium text-ink-primary">Tests Worth Running</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                AI-identified testing opportunities based on your creative and performance data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">How it works</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            From upload to insight in three steps.
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {howItWorks.map((s, i) => (
              <div key={s.step} className="relative">
                <span className="text-sm font-medium text-brand-light">{`0${i + 1}`}</span>
                <h3 className="mt-3 text-lg font-medium text-ink-primary">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">Integrations</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Bring your real advertising data in.
          </h2>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {["Meta Ads", "TikTok Ads", "Google Ads"].map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 rounded-full border border-base-border bg-base-card px-6 py-3 text-sm text-ink-secondary"
              >
                <ShieldCheck size={16} className="text-brand-light" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-light">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
              Simple plans that scale with your spend.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-8 ${
                  p.highlight
                    ? "border-brand/60 bg-base-card shadow-glow"
                    : "border-base-border bg-base-card"
                }`}
              >
                {p.highlight && (
                  <span className="mb-4 inline-block rounded-full bg-brand/15 px-3 py-1 text-xs text-brand-light">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-medium text-ink-primary">{p.name}</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-ink-primary">{p.price}</span>
                  <span className="text-sm text-ink-muted">{p.period}</span>
                </p>
                <p className="mt-2 text-sm text-ink-secondary">{p.description}</p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent-green" /> {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href="/signup"
                  variant={p.highlight ? "primary" : "secondary"}
                  className="mt-8 w-full"
                >
                  {p.cta}
                </ButtonLink>
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
              <details
                key={f.q}
                className="group rounded-xl border border-base-border bg-base-card p-5"
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
      <section className="border-t border-white/5 px-6 py-28 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
          Start creating better ads today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
          Free to try. No credit card required to see your first analysis.
        </p>
        <div className="mt-8">
          <ButtonLink href="/signup" className="px-7 py-3.5 text-base">
            Start Free Trial <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </section>

      <Footer />
    </>
  );
}
