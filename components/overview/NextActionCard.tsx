import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import type { NextAction } from "@/lib/overviewInsights";

// "What to Improve Next": one recommendation chosen from the user's real
// analyses (see nextAction in lib/overviewInsights.ts), or "analyze your first
// creative" when there's no history — never a generic tip dressed up as personal.

export function NextActionCard({ action }: { action: NextAction }) {
  return (
    <section
      aria-labelledby="next-title"
      className="ov-reveal next-card relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand/35 p-5 sm:p-6"
      style={{ animationDelay: "40ms" }}
    >
      <span aria-hidden className="next-glow" />
      <p className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-brand-light">
        <Compass size={14} /> What to improve next
      </p>
      <h2 id="next-title" className="relative mt-3 text-lg font-semibold leading-snug text-ink-primary">
        {action.title}
      </h2>
      <p className="relative mt-2 text-sm leading-relaxed text-ink-primary/90">{action.detail}</p>
      <p className="relative mt-3 text-xs leading-relaxed text-ink-secondary">
        <span className="text-ink-muted">Why this: </span>
        {action.why}
      </p>
      <div className="relative mt-auto pt-5">
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-[filter] hover:brightness-110"
        >
          {action.cta}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
