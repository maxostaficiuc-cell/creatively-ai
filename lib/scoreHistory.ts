// SERVER ONLY. Loads the signed-in user's score history for the dashboard chart.
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_RANGE_HOURS, toScorePoints, type ScorePoint, type ScoreRow } from "@/lib/creativePerformanceTrend";

const PAGE = 1000; // Supabase returns at most 1,000 rows per request, so page through
const MAX_ROWS = 10_000;

/**
 * Every completed analysis from the last 30 days (the longest chart range),
 * read from public.creatives with the user's own session (RLS applies).
 * Pages through results so a busy account never silently loses older points.
 */
export async function loadScoreHistory(
  supabase: SupabaseClient,
  userId: string,
  now: number = Date.now()
): Promise<{ points: ScorePoint[]; error: boolean }> {
  // A few minutes of margin so the client's own clock decides the exact edge.
  const since = new Date(now - (MAX_RANGE_HOURS + 1) * 3_600_000).toISOString();
  const rows: ScoreRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from("creatives")
      .select("id, score, created_at, summary, file_type, platform, is_simulated")
      .eq("user_id", userId)
      .gte("created_at", since)
      .not("score", "is", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error(JSON.stringify({ evt: "score_history_error", msg: error.message }));
      return { points: [], error: true };
    }
    rows.push(...((data ?? []) as ScoreRow[]));
    if (!data || data.length < PAGE) break;
  }
  return { points: toScorePoints(rows), error: false };
}
