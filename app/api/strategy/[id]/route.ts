import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, loadGenerations, loadStrategy } from "@/lib/strategyServer";

// GET — one saved strategy (owner only) plus its generated creatives.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "Please sign in again.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return jsonError(503, "Not configured.");
  const db = createAdminClient();
  const strategy = await loadStrategy(db, params.id, user.id);
  if (!strategy) return jsonError(404, "Strategy not found.");
  return NextResponse.json({ strategy, generations: await loadGenerations(db, strategy.id, user.id) });
}
