"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PLANS, ANNUAL_DISCOUNT_LABEL } from "@/lib/pricing";

export function PricingCards() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="mx-auto mb-14 flex w-fit flex-col items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-base-border bg-base-card p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              !annual ? "bg-base-surface text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              annual ? "bg-base-surface text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            Annually
          </button>
        </div>
        <span
          className={`text-xs font-medium transition-opacity ${
            annual ? "text-accent-green opacity-100" : "opacity-0"
          }`}
        >
          {ANNUAL_DISCOUNT_LABEL}
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => {
          const isEnterprise = plan.monthlyPrice === null;
          const displayPrice = isEnterprise
            ? "Let's Talk"
            : annual
            ? `$${plan.annualPrice}`
            : `$${plan.monthlyPrice}`;
          const displayPeriod = isEnterprise ? "" : annual ? "/year" : "/month";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                plan.highlight
                  ? "border-brand/60 bg-base-card shadow-glow"
                  : "border-base-border bg-base-card"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-glow">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-brand-light">
                <Sparkles size={16} />
              </div>

              <h3 className="text-lg font-medium text-ink-primary">{plan.name}</h3>
              <p className="mt-1.5 text-sm text-ink-secondary">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span
                  className={`font-bold tracking-tight ${
                    isEnterprise ? "text-3xl text-ink-primary" : "text-4xl text-ink-primary"
                  }`}
                >
                  {displayPrice}
                </span>
                {displayPeriod && <span className="text-sm text-ink-muted">{displayPeriod}</span>}
              </div>
              {!isEnterprise && plan.weeklyCredits && (
                <p className="mt-1 text-xs text-ink-muted">
                  {plan.weeklyCredits.toLocaleString()} AI credits / week · {plan.fourWeekCredits} / 4 weeks
                </p>
              )}

              <Link
                href={isEnterprise ? "/pricing#contact" : "/signup"}
                className={`mt-7 flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition-all ${
                  plan.highlight
                    ? "bg-gradient-to-b from-brand-light to-brand text-white shadow-glow hover:brightness-110"
                    : "border border-base-border text-ink-primary hover:border-brand/50"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
                    <Check size={15} className="mt-0.5 shrink-0 text-accent-green" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
