export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  persona: string | null;
  ad_platforms: string[] | null;
  main_goal: string | null;
  onboarding_completed: boolean;
  plan: string;
  ai_credits: number;
  credits_reset_at: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Creative = {
  id: string;
  user_id: string;
  file_url: string;
  file_type: "image" | "video";
  platform: string | null;
  score: number | null;
  summary: string | null;
  whats_working: string | null;
  whats_not: string | null;
  what_to_test: string | null;
  credits_used: number;
  is_simulated: boolean;
  created_at: string;
};

export type AdAccount = {
  id: string;
  user_id: string;
  platform: "meta" | "tiktok" | "google";
  external_account_id: string | null;
  account_name: string | null;
  status: "connected" | "error" | "disconnected";
  created_at: string;
};

// ─── Credits: single source of truth ───────────────────────────────────────
export const CREDIT_COST_IMAGE = 100;
export const CREDIT_COST_VIDEO = 500;

// Weekly credit allowance per plan. This is the ONE place plan credit
// amounts are defined — every page (dashboard, billing, analyze, etc.)
// should read from here, never hardcode a number.
export const PLAN_WEEKLY_CREDITS: Record<string, number> = {
  Starter: 0,
  Pro: 1000,
  Max: 10000,
  Custom: 50000,
};

export const PLAN_ORDER = ["Starter", "Pro", "Max", "Custom"];

export function nextPlan(currentPlan: string): string | null {
  const idx = PLAN_ORDER.indexOf(currentPlan);
  if (idx === -1 || idx === PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[idx + 1];
}

export function weeklyAllowanceFor(plan: string): number {
  return PLAN_WEEKLY_CREDITS[plan] ?? PLAN_WEEKLY_CREDITS.Pro;
}
