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
  access_token: string | null;
  token_expires_at: string | null;
  status: "connected" | "error" | "disconnected";
  created_at: string;
};

// ─── Credits: single source of truth ───────────────────────────────────────
// The actual plan data (prices, features, weekly credits) lives in
// lib/pricing.ts — this file just re-exports credit-lookup helpers under
// their existing names so Sidebar, TopBar, lib/profile.ts, and the analyze
// route don't need to change their imports.
import { PLANS, planAfter } from "@/lib/pricing";

export const CREDIT_COST_IMAGE = 100;
export const CREDIT_COST_VIDEO = 500;

export const PLAN_WEEKLY_CREDITS: Record<string, number> = Object.fromEntries(
  PLANS.filter((p) => p.weeklyCredits !== null).map((p) => [p.id, p.weeklyCredits as number])
);

export const PLAN_ORDER = PLANS.map((p) => p.id);

export function nextPlan(currentPlan: string): string | null {
  return planAfter(currentPlan)?.id ?? null;
}

export function weeklyAllowanceFor(plan: string): number {
  return PLAN_WEEKLY_CREDITS[plan] ?? PLAN_WEEKLY_CREDITS.Pro;
}
