import { ArrowRight } from "lucide-react";
import { STARTER_TRIAL, TRIAL_TERMS, trialHref, type TrialPlacement } from "@/lib/starterTrial";

// Shared "Try for $1" button + compact callout. Server-safe (no hooks), so it
// can sit in server and client components alike.
//
// A plain <a> on purpose: /start-trial is a route handler that redirects to
// signup or to Whop's checkout, so it needs a full navigation, not a
// client-side Next.js transition.

const SIZES = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-[52px] px-7 text-[15px]",
} as const;

export function TrialButton({
  placement,
  children,
  size = "md",
  arrow = true,
  className = "",
}: {
  placement: TrialPlacement;
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <a
      href={trialHref(placement)}
      data-cta="starter_trial"
      data-placement={placement}
      className={`trial-btn group inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold text-white ${SIZES[size]} ${className}`}
    >
      {children}
      {arrow && <ArrowRight size={size === "sm" ? 14 : 16} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />}
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
