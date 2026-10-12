// ─────────────────────────────────────────────────────────────────────────────
// Starter introductory offer — "$1 for the first 7 days, then $9/month".
// Single source of truth for every place the offer is shown.
//
// The offer is ONLY shown when the matching Whop plan exists, i.e. when
// NEXT_PUBLIC_WHOP_CHECKOUT_URL_STARTER_TRIAL is set. That Whop plan must be:
//   • plan type: renewal (recurring)
//   • initial price: $1        (charged at checkout)
//   • free trial: 7 days       (delays the first $9 renewal by 7 days)
//   • renewal price: $9 every 30 days
// Its plan_id goes in WHOP_PLAN_ID_STARTER_TRIAL so the webhook grants Starter.
//
// Without that env var every trial button falls back to the normal Starter
// flow and no "$1" wording appears anywhere — the site never advertises an
// offer that can't actually be bought.
// ─────────────────────────────────────────────────────────────────────────────

import { PLANS } from "@/lib/pricing";

const STARTER_MONTHLY = PLANS.find((p) => p.id === "Starter")?.monthlyPrice ?? 9;

export const STARTER_TRIAL = {
  enabled: Boolean(process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_STARTER_TRIAL),
  /** Keep these in sync with the Whop plan (initial price + trial days). */
  introPrice: 1,
  days: 7,
  renewalPrice: STARTER_MONTHLY,
} as const;

/** "7 days for $1, then $9/month." */
export const TRIAL_TERMS = `${STARTER_TRIAL.days} days for $${STARTER_TRIAL.introPrice}, then $${STARTER_TRIAL.renewalPrice}/month.`;

/** Placements, for click logging (server log line `starter_trial_cta_clicked`). */
export type TrialPlacement =
  | "nav"
  | "nav-mobile"
  | "hero"
  | "features"
  | "how-it-works"
  | "analyzer"
  | "showcase"
  | "winning-ads"
  | "pricing"
  | "final"
  | "footer"
  | "free-report-modal"
  | "post-analysis"
  | "onboarding";

/** Every trial button goes through /start-trial, which picks signup vs checkout. */
export function trialHref(placement: TrialPlacement) {
  return STARTER_TRIAL.enabled ? `/start-trial?from=${placement}` : "/signup?plan=Starter";
}
