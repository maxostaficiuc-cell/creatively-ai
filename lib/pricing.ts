// ─── Single source of truth for pricing/plans ──────────────────────────────
// Both the public /pricing page and the authenticated /billing page import
// PLANS from here. Never duplicate plan names, prices, or credit numbers
// anywhere else — everything should read from this file.

export type PlanId = "Starter" | "Pro" | "Business" | "Enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in whole dollars. null = no self-serve price (Enterprise). */
  monthlyPrice: number | null;
  /** Total price for a full year of annual billing (3 months free / 25% off). */
  annualPrice: number | null;
  weeklyCredits: number | null;
  fourWeekCredits: string | null;
  badge: string | null;
  highlight: boolean;
  features: string[];
  cta: string;
  ctaCurrent: string;
  rank: number;
};

export const ANNUAL_DISCOUNT_LABEL = "Save 25% · 3 months free";

export const PLANS: Plan[] = [
  {
    id: "Starter",
    name: "Starter",
    tagline: "For individuals getting started with AI creative intelligence.",
    monthlyPrice: 9,
    annualPrice: 81,
    weeklyCredits: 1000,
    fourWeekCredits: "~4,000",
    badge: null,
    highlight: false,
    features: [
      "AI Creative Analysis",
      "Image Analysis",
      "Basic Creative Score",
      "What's Great / What's Not / Improvements",
      "Creative History",
      "1,000 AI Credits / week",
      "Standard AI Processing",
    ],
    cta: "Get Started",
    ctaCurrent: "Current Plan",
    rank: 0,
  },
  {
    id: "Pro",
    name: "Pro",
    tagline: "For marketers, media buyers, and growing brands.",
    monthlyPrice: 49,
    annualPrice: 441,
    weeklyCredits: 10000,
    fourWeekCredits: "~40,000",
    badge: "MOST POPULAR",
    highlight: true,
    features: [
      "Everything in Starter",
      "10,000 AI Credits / week",
      "Advanced AI Creative Analysis",
      "More rigorous 0–100 Creative Scoring",
      "Creative Comparison",
      "Advanced Recommendations",
      "Creative Intelligence",
      "Creative Performance Insights",
      "Priority AI Processing",
      "Faster Analysis",
      "Meta Ads Integration",
      "Performance Overview",
      "Campaign / Ad Set / Ad Insights",
    ],
    cta: "Start with Pro",
    ctaCurrent: "Current Plan",
    rank: 1,
  },
  {
    id: "Business",
    name: "Business",
    tagline: "For agencies and teams running creative intelligence at scale.",
    monthlyPrice: 299,
    annualPrice: 2691,
    weeklyCredits: 100000,
    fourWeekCredits: "~400,000",
    badge: null,
    highlight: false,
    features: [
      "Everything in Pro",
      "100,000 AI Credits / week",
      "Advanced Creative Intelligence",
      "Bulk creative analysis",
      "Advanced creative comparison",
      "Team collaboration",
      "Client / workspace organization",
      "Advanced reporting",
      "Exportable reports",
      "Multiple connected ad accounts",
      "Priority support",
      "Early access to new features",
    ],
    cta: "Start Business",
    ctaCurrent: "Current Plan",
    rank: 2,
  },
  {
    id: "Enterprise",
    name: "Enterprise",
    tagline: "For organizations with custom requirements, large teams, and high-volume workloads.",
    monthlyPrice: null,
    annualPrice: null,
    weeklyCredits: null,
    fourWeekCredits: null,
    badge: null,
    highlight: false,
    features: [
      "Everything in Business",
      "Custom AI credit allocation",
      "SSO / SAML",
      "More than 5 users",
      "Advanced team permissions",
      "Custom roles",
      "Dedicated account management",
      "Custom onboarding",
      "Data export",
      "Custom integrations",
      "Custom billing",
      "Enterprise SLA options",
    ],
    cta: "Talk to Sales",
    ctaCurrent: "Current Plan",
    rank: 3,
  },
];

export function getPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1];
}

export function planAfter(id: string): Plan | null {
  const current = getPlan(id);
  return PLANS.find((p) => p.rank === current.rank + 1) ?? null;
}
