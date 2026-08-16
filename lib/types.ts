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
  created_at: string;
  updated_at: string;
};
