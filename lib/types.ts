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

export const CREDIT_COST_IMAGE = 100;
export const CREDIT_COST_VIDEO = 500;
