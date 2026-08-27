import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Revalidate at most every 2 minutes — real usage doesn't change fast
// enough to need fetching on every request, and this keeps load off the
// database from public traffic.
export const revalidate = 120;

// Real, honest aggregate platform stats — no fabricated numbers, no
// fake incrementing counters. Exposes ONLY safe aggregate counts, never
// individual rows, emails, or any per-user data.
//
// If SUPABASE_SERVICE_ROLE_KEY isn't configured, this quietly returns
// zeros rather than crashing the homepage — the frontend treats that as
// "not enough data yet" rather than an error.
export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ creativesAnalyzed: 0, creditsProcessed: 0, configured: false });
  }

  try {
    const supabase = createAdminClient();

    const [{ count: creativesAnalyzed }, { data: creditsRows }] = await Promise.all([
      supabase.from("creatives").select("id", { count: "exact", head: true }),
      supabase.from("creatives").select("credits_used"),
    ]);

    const creditsProcessed = (creditsRows || []).reduce(
      (sum, row: { credits_used: number | null }) => sum + (row.credits_used || 0),
      0
    );

    return NextResponse.json({
      creativesAnalyzed: creativesAnalyzed ?? 0,
      creditsProcessed,
      configured: true,
    });
  } catch (err) {
    console.error("public-stats: failed to compute aggregate stats:", err);
    return NextResponse.json({ creativesAnalyzed: 0, creditsProcessed: 0, configured: false });
  }
}
