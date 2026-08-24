// Two separate mappings live here, both driven by env vars:
//
// 1. Checkout URLs — plain Whop-hosted checkout link URLs, used directly
//    by the Upgrade buttons and onboarding. Not secret, safe as NEXT_PUBLIC_.
//
// 2. Plan IDs — the underlying Whop plan_id behind each checkout link.
//    The webhook needs these to figure out WHICH plan someone just bought
//    (Whop's webhook tells us the plan_id that was purchased, not which of
//    our plan names it corresponds to — this is the one place that
//    translation lives). These stay server-only, no NEXT_PUBLIC_ prefix.
import type { PlanId } from "@/lib/pricing";

type OurPlan = Exclude<PlanId, "Enterprise">;

const CHECKOUT_URL_BY_PLAN: Record<OurPlan, string | undefined> = {
  Starter: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_STARTER,
  Pro: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_PRO,
  Business: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_BUSINESS,
};

const PLAN_ID_BY_PLAN: Record<OurPlan, string | undefined> = {
  Starter: process.env.WHOP_PLAN_ID_STARTER,
  Pro: process.env.WHOP_PLAN_ID_PRO,
  Business: process.env.WHOP_PLAN_ID_BUSINESS,
};

export function checkoutUrlFor(ourPlan: string): string | null {
  return CHECKOUT_URL_BY_PLAN[ourPlan as OurPlan] || null;
}

export function ourPlanFromWhopPlanId(whopPlanId: string): OurPlan | null {
  for (const [ourPlan, id] of Object.entries(PLAN_ID_BY_PLAN)) {
    if (id && id === whopPlanId) return ourPlan as OurPlan;
  }
  return null;
}
