import { NextResponse } from "next/server";
import { buildConcepts } from "@/lib/strategyAI";
import { AnalysisError } from "@/lib/analyzeCreative";
import { jsonError, loadStrategy, log, requireActiveUser } from "@/lib/strategyServer";
import { STRATEGY_COLUMNS } from "@/lib/strategyTypes";

// Step 3: advertising opportunities + 4–6 recommended ad concepts.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const t0 = Date.now();
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const strategy = await loadStrategy(auth.db, params.id, auth.userId);
  if (!strategy?.brand_profile) return jsonError(404, "Strategy not found.");
  if (!strategy.audience?.length) return jsonError(409, "Audience insights must be generated first.");
  if (strategy.concepts?.length) return NextResponse.json({ strategy }); // idempotent
  try {
    const { opportunities, concepts } = await buildConcepts(strategy.brand_profile, strategy.audience, t0 + 26_000);
    if (concepts.length === 0) return jsonError(502, "The AI didn't return any concepts. Please try again.");
    const { data, error } = await auth.db
      .from("brand_strategies")
      .update({ opportunities, concepts, status: "ready", updated_at: new Date().toISOString() })
      .eq("id", strategy.id)
      .eq("user_id", auth.userId)
      .select(STRATEGY_COLUMNS)
      .single();
    if (error) return jsonError(500, "Couldn't save the concepts.");
    log("concepts", { id: strategy.id, n: concepts.length, ms: Date.now() - t0 });
    return NextResponse.json({ strategy: data });
  } catch (e) {
    const code = e instanceof AnalysisError ? e.code : "ai_failed";
    return jsonError(code === "ai_timeout" ? 504 : 502, "The AI couldn't finish the concepts step. Please try again.", { code });
  }
}
