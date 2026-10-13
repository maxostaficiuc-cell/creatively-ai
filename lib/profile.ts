import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { weeklyAllowanceFor } from "@/lib/types";
import { bonusOf, hasBonusColumn, remainingBonus } from "@/lib/bonusCredits";
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

  // Billing columns are server-only (migration-011 locks them for browser
  // sessions), so balance writes go through the service-role client.
  const writer: SupabaseClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

  const isPaid = profile.subscription_status === "active";

  if (!isPaid) {
    // Never trust a stale non-zero balance on an unpaid account — force it
    // to 0 every time this runs, regardless of how it got there.
    if (profile.ai_credits !== 0) {
      const zero: Record<string, number> = { ai_credits: 0 };
      // Keep a record of any bonus that was still unspent, so it comes back
      // if the account pays again (it is never usable while unpaid).
      if (hasBonusColumn(profile)) zero.bonus_credits = remainingBonus(bonusOf(profile), profile.ai_credits);
      const { data: updated } = await writer
        .from("profiles")
        .update(zero)
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
  const bonus = bonusOf(profile);
  const windowPassed = now >= resetAt;

  // Two conditions trigger a reset: the weekly window has passed, OR the
  // stored balance is somehow above what the plan allows plus any bonus
  // credits (this catches stale data left over from before weekly limits
  // existed, without waiting for the next calendar reset).
  const needsReset = windowPassed || profile.ai_credits > allowance + bonus;

  if (needsReset) {
    const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    // Unspent bonus survives the reset; the allowance is refilled as before.
    const bonusLeft = windowPassed ? remainingBonus(bonus, profile.ai_credits) : bonus;
    const reset: Record<string, unknown> = { ai_credits: allowance + bonusLeft, credits_reset_at: nextReset.toISOString() };
    if (hasBonusColumn(profile)) reset.bonus_credits = bonusLeft;

    const { data: updated } = await writer
      .from("profiles")
      .update(reset)
      .eq("id", userId)
      .select("*")
      .single<Profile>();

    return updated ?? profile;
  }

  // Credits held by an analysis that crashed (e.g. a platform timeout) come
  // back after 3 minutes. No-op until migration-011 is run.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: refunded } = await writer.rpc("release_stale_credit_reservations", { p_user_id: userId });
    if (typeof refunded === "number" && refunded > 0) {
      return { ...profile, ai_credits: profile.ai_credits + refunded };
    }
  }

  return profile;
}
