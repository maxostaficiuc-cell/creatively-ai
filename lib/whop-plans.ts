// Maps our internal plan ids (from lib/pricing.ts) + billing interval to the
// actual Whop plan IDs you create in your Whop dashboard. This is the ONE
// place that mapping lives — the checkout route and the webhook handler
// both read from here, so they can never disagree about which Whop plan
// corresponds to which of our plans.
import type { PlanId } from "@/lib/pricing";

export type BillingInterval = "monthly" | "annual";

type Entry = {
  ourPlan: Exclude<PlanId, "Enterprise">;
  interval: BillingInterval;
  envVar: string;
};

const ENTRIES: Entry[] = [
  { ourPlan: "Starter", interval: "monthly", envVar: "WHOP_PLAN_ID_STARTER_MONTHLY" },
  { ourPlan: "Starter", interval: "annual", envVar: "WHOP_PLAN_ID_STARTER_ANNUAL" },
  { ourPlan: "Pro", interval: "monthly", envVar: "WHOP_PLAN_ID_PRO_MONTHLY" },
  { ourPlan: "Pro", interval: "annual", envVar: "WHOP_PLAN_ID_PRO_ANNUAL" },
  { ourPlan: "Business", interval: "monthly", envVar: "WHOP_PLAN_ID_BUSINESS_MONTHLY" },
  { ourPlan: "Business", interval: "annual", envVar: "WHOP_PLAN_ID_BUSINESS_ANNUAL" },
];

export function whopPlanIdFor(ourPlan: string, interval: BillingInterval): string | null {
  const entry = ENTRIES.find((e) => e.ourPlan === ourPlan && e.interval === interval);
  if (!entry) return null;
  return process.env[entry.envVar] || null;
}

export function ourPlanFromWhopPlanId(
  whopPlanId: string
): { ourPlan: PlanId; interval: BillingInterval } | null {
  for (const entry of ENTRIES) {
    if (process.env[entry.envVar] === whopPlanId) {
      return { ourPlan: entry.ourPlan, interval: entry.interval };
    }
  }
  return null;
}
