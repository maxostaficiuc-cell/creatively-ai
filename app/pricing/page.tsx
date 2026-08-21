import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { PricingCards } from "./PricingCards";

export default function PricingPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden px-6 py-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] opacity-30"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(139,92,246,0.25), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-primary sm:text-5xl">
            Simple plans that scale with your creative intelligence.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Start small, scale your analysis, and unlock deeper advertising intelligence as your
            needs grow.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <PricingCards />
        </div>
      </section>
      <Footer />
    </>
  );
}
