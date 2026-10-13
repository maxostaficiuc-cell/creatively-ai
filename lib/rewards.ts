// SERVER ONLY — the signed-in user's early-customer reward state (read with
// their own session; RLS limits reward_grants to their own row).
import type { SupabaseClient } from "@supabase/supabase-js";

export const EARLY_REWARD_PROGRAM = "early_ad_integrations";

export type RewardState =
  | { setup: false }
  | {
      setup: true;
      amount: number;
      launchedAt: string | null;
      grant: { status: "reserved" | "granted" | "void"; reservedAt: string; grantedAt: string | null; amount: number } | null;
    };

export async function getRewardState(supabase: SupabaseClient, userId: string): Promise<RewardState> {
  const { data: program, error } = await supabase
    .from("reward_programs")
    .select("amount, launched_at")
    .eq("id", EARLY_REWARD_PROGRAM)
    .maybeSingle();
  if (error || !program) return { setup: false }; // migration-013 not run yet
  const { data: g } = await supabase
    .from("reward_grants")
    .select("status, reserved_at, granted_at, amount")
    .eq("program_id", EARLY_REWARD_PROGRAM)
    .eq("user_id", userId)
    .maybeSingle();
  return {
    setup: true,
    amount: program.amount,
    launchedAt: program.launched_at,
    grant: g ? { status: g.status, reservedAt: g.reserved_at, grantedAt: g.granted_at, amount: g.amount } : null,
  };
}
