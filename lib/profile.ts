import type { SupabaseClient } from "@supabase/supabase-js";
import { weeklyAllowanceFor } from "@/lib/types";
import type { Profile } from "@/lib/types";

/**
 * The single place credits are read AND reset from. Every server page that
 * needs the current user's profile should call this instead of querying
 * `profiles` directly — it guarantees the weekly credit reset has been
 * applied before the balance is shown or used anywhere in the app.
 *
 * CRITICAL: credits are only ever granted when subscription_status is
 * 'active' — set exclusively by the verified Whop webhook after a real
 * payment event, never by onboarding, signup, or any other client-facing
 * flow. An unpaid account always has 0 credits, full stop, regardless of
 * what `plan` says (plan is just a display label until payment happens).
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

  const isPaid = profile.subscription_status === "active";

  if (!isPaid) {
    // Never trust a stale non-zero balance on an unpaid account — force it
    // to 0 every time this runs, regardless of how it got there.
    if (profile.ai_credits !== 0) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({ ai_credits: 0 })
        .eq("id", userId)
        .select("*")
        .single<Profile>();
      return updated ?? profile;
    }
    return profile;
  }

  const resetAt = new Date(profile.credits_reset_at);
  const now = new Date();
  const allowance = weeklyAllowanceFor(profile.plan);

  // Two conditions trigger a reset: the weekly window has passed, OR the
  // stored balance is somehow above what the plan allows (this catches
  // stale data left over from before weekly limits existed, without
  // waiting for the next calendar reset).
  const needsReset = now >= resetAt || profile.ai_credits > allowance;

  if (needsReset) {
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
