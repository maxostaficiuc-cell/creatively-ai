"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { STARTER_TRIAL, TRIAL_TERMS, trialHref, type TrialPlacement } from "@/lib/starterTrial";

// The ONE shared "Try for $1" button (nav, hero, free-report modal,
// post-analysis offer, pricing card, final CTA, section callouts).
//
// • A plain <a>: /start-trial is a route handler that redirects to signup or
//   to Whop's checkout, so it needs a full navigation — never delayed by an
//   animation.
// • After the first click it shows a spinner (same size, label kept in place
//   for width) and ignores repeat clicks until the page changes.
// • Styling + motion live in globals.css (.trial-btn): idle glow + sweep,
//   hover lift, press scale, focus ring, all off under reduced motion.

const SIZES = {
  compact: "trial-btn--compact",
  default: "trial-btn--default",
  large: "trial-btn--large",
} as const;

export function TrialButton({
  placement,
  children = "Try for $1",
  size = "default",
  arrow = true,
  className = "",
}: {
  placement: TrialPlacement;
  children?: React.ReactNode;
  size?: keyof typeof SIZES;
  arrow?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  // Coming back with the browser's Back button restores the page from cache —
  // make sure the button isn't stuck in its loading state.
  useEffect(() => {
    const reset = () => setLoading(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <a
      href={trialHref(placement)}
      data-cta="starter_trial"
      data-placement={placement}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={(e) => {
        // let modified clicks (new tab etc.) through untouched
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (loading) {
          e.preventDefault();
          return;
        }
        setLoading(true);
      }}
      className={`trial-btn ${SIZES[size]} ${loading ? "is-loading" : ""} ${className}`}
    >
      <span className="trial-btn__label">
        {children}
        {arrow && <ArrowRight className="trial-btn__arrow" aria-hidden />}
      </span>
      <span className="trial-btn__spinner" aria-hidden />
      {loading && <span className="sr-only">Opening checkout…</span>}
    </a>
  );
}

/** Heading + trial button + renewal terms. Renders nothing until the offer is live. */
export function TrialCallout({
  title,
  label,
  placement,
  className = "",
}: {
  title: string;
  label: string;
  placement: TrialPlacement;
  className?: string;
}) {
  if (!STARTER_TRIAL.enabled) return null;
  return (
    <div data-reveal className={`trial-callout mx-auto flex max-w-xl flex-col items-center text-center ${className}`}>
      <p className="text-lg font-medium tracking-tight text-ink-primary sm:text-xl">{title}</p>
      <TrialButton placement={placement} className="mt-5">
        {label}
      </TrialButton>
      <p className="mt-3 text-xs text-ink-muted">{TRIAL_TERMS}</p>
    </div>
  );
}
