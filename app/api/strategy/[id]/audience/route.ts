import { recordSystemEvent } from "@/lib/systemEvents";
import { NextResponse } from "next/server";
import { buildAudience } from "@/lib/strategyAI";
import { AnalysisError } from "@/lib/analyzeCreative";
import { aiStepFailed, jsonError, loadStrategy, log, requireActiveUser } from "@/lib/strategyServer";
import { STRATEGY_COLUMNS } from "@/lib/strategyTypes";

// Step 2: audience segments from the (possibly user-edited) brand profile.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const t0 = Date.now();
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const strategy = await loadStrategy(auth.db, params.id, auth.userId);
  if (!strategy?.brand_profile) return jsonError(404, "Strategy not found.");
  if (strategy.audience?.length) return NextResponse.json({ strategy }); // already done (reload / retry)
  try {
    const audience = await buildAudience(strategy.brand_profile, t0 + 26_000);
    const { data, error } = await auth.db
      .from("brand_strategies")
      .update({ audience, status: "audience", updated_at: new Date().toISOString() })
      .eq("id", strategy.id)
      .eq("user_id", auth.userId)
      .select(STRATEGY_COLUMNS)
      .single();
    if (error) return jsonError(500, "Couldn't save the audience insights.");
    log("audience", { id: strategy.id, n: audience.length, ms: Date.now() - t0 });
    return NextResponse.json({ strategy: data });
  } catch (e) {
    const code = e instanceof AnalysisError ? e.code : "ai_failed";
    await recordSystemEvent({ category: "ai_provider", source: "api/strategy/[id]/audience", code, message: `Creative Strategy audience step failed (${code}).`, userId: auth.userId });
    return aiStepFailed(code);
  }
}
