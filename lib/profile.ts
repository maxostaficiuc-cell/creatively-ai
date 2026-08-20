import type { SupabaseClient } from "@supabase/supabase-js";
import { weeklyAllowanceFor } from "@/lib/types";
import type { Profile } from "@/lib/types";

/**
 * The single place credits are read AND reset from. Every server page that
 * needs the current user's profile should call this instead of querying
 * `profiles` directly — it guarantees the weekly credit reset has been
 * applied before the balance is shown or used anywhere in the app.
 */
export async function getFreshProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) return null;

  const resetAt = new Date(profile.credits_reset_at);
  const now = new Date();

  if (now >= resetAt) {
    const allowance = weeklyAllowanceFor(profile.plan);
    const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: updated } = await supabase
      .from("profiles")
      .update({ ai_credits: allowance, credits_reset_at: nextReset.toISOString() })
      .eq("id", userId)
      .select("*")
      .single<Profile>();

    return updated ?? profile;
  }

  return profile;
}
