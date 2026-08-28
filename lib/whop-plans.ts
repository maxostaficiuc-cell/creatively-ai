// Two separate mappings live here, both driven by env vars, both keyed by
// plan AND billing interval (monthly vs annual are separate Whop plans
// with separate checkout links and separate plan_ids):
//
// 1. Checkout URLs — plain Whop-hosted checkout link URLs, used directly
//    by the Upgrade buttons. Not secret, safe as NEXT_PUBLIC_.
//
// 2. Plan IDs — the underlying Whop plan_id behind each checkout link.
//    The webhook needs these to figure out WHICH of our plans someone
//    bought. The interval doesn't change what we grant (credits are the
//    same whether billed monthly or annually), so ourPlanFromWhopPlanId
//    checks both the monthly and annual id and just returns the tier.
import type { PlanId } from "@/lib/pricing";

export type BillingInterval = "monthly" | "annual";
type OurPlan = Exclude<PlanId, "Enterprise">;

const CHECKOUT_URL_BY_PLAN: Record<OurPlan, Record<BillingInterval, string | undefined>> = {
  Starter: {
    monthly: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_STARTER_MONTHLY,
    annual: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_STARTER_ANNUAL,
  },
  Pro: {
    monthly: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_PRO_MONTHLY,
    annual: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_PRO_ANNUAL,
  },
  Business: {
    monthly: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_BUSINESS_MONTHLY,
    annual: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_BUSINESS_ANNUAL,
  },
};

const PLAN_ID_BY_PLAN: Record<OurPlan, Record<BillingInterval, string | undefined>> = {
  Starter: {
    monthly: process.env.WHOP_PLAN_ID_STARTER_MONTHLY,
    annual: process.env.WHOP_PLAN_ID_STARTER_ANNUAL,
  },
  Pro: {
    monthly: process.env.WHOP_PLAN_ID_PRO_MONTHLY,
    annual: process.env.WHOP_PLAN_ID_PRO_ANNUAL,
  },
  Business: {
    monthly: process.env.WHOP_PLAN_ID_BUSINESS_MONTHLY,
    annual: process.env.WHOP_PLAN_ID_BUSINESS_ANNUAL,
  },
};

export function checkoutUrlFor(ourPlan: string, interval: BillingInterval = "monthly"): string | null {
  return CHECKOUT_URL_BY_PLAN[ourPlan as OurPlan]?.[interval] || null;
}

export function ourPlanFromWhopPlanId(whopPlanId: string): OurPlan | null {
  for (const [ourPlan, ids] of Object.entries(PLAN_ID_BY_PLAN)) {
    if (ids.monthly === whopPlanId || ids.annual === whopPlanId) return ourPlan as OurPlan;
  }
  return null;
}
