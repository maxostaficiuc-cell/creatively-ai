import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Try Creatively.ai with limited analyses.",
    features: ["10 creative analyses / mo", "1 connected ad account", "Winning Ads library access"],
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
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-ink-primary">Pricing</h1>
            <p className="mt-3 text-ink-secondary">Simple plans that scale with your ad spend.</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-8 ${
                  p.highlight ? "border-brand/60 bg-base-card shadow-glow" : "border-base-border bg-base-card"
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
                <ButtonLink href="/signup" variant={p.highlight ? "primary" : "secondary"} className="mt-8 w-full">
                  Start Free Trial
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
