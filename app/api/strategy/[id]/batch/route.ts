import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildVariations } from "@/lib/strategyAI";
import { geminiConfigured } from "@/lib/geminiImage";
import { AnalysisError } from "@/lib/analyzeCreative";
import { CREDIT_COST_GENERATED_IMAGE } from "@/lib/types";
import { countLast24h, jsonError, loadStrategy, log, requireActiveUser, withImageUrls } from "@/lib/strategyServer";
import { ASPECT_RATIOS, DAILY_BATCH_LIMIT, GENERATION_COLUMNS, PLATFORMS, STYLES, TEXT_DENSITY, VARIATION_COUNTS, type GenerationOptions } from "@/lib/strategyTypes";

// Prepares N variations of one concept: writes each variation's copy + visual
// direction (Claude) and creates one pending generation per image, each with
// its own credit-ledger request id. No credits are taken here — each image is
// charged only when it is actually delivered (see /generations/[id]/run).
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const t0 = Date.now();
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  if (!geminiConfigured()) {
    return jsonError(503, "Image generation isn't set up yet: the server needs a GEMINI_API_KEY. Your strategy and concepts still work.", { code: "image_not_configured" });
  }
  const s = await loadStrategy(auth.db, params.id, auth.userId);
  if (!s?.brand_profile || !s.concepts) return jsonError(404, "Strategy not found.");
  const body = (await req.json().catch(() => null)) as { conceptId?: string; count?: number; options?: Partial<GenerationOptions> } | null;
  const concept = s.concepts.find((c) => c.id === body?.conceptId);
  if (!concept) return jsonError(400, "Choose a concept.");
  const count = Number(body?.count);
  if (!VARIATION_COUNTS.includes(count as (typeof VARIATION_COUNTS)[number])) return jsonError(400, "Choose 1, 3 or 5 variations.");
  const o = body?.options ?? {};
  const options: GenerationOptions = {
    aspect_ratio: ASPECT_RATIOS.some((a) => a.id === o.aspect_ratio) ? (o.aspect_ratio as GenerationOptions["aspect_ratio"]) : "4:5",
    style: STYLES.some((x) => x.id === o.style) ? (o.style as GenerationOptions["style"]) : "clean_product",
    text_density: TEXT_DENSITY.some((x) => x.id === o.text_density) ? (o.text_density as GenerationOptions["text_density"]) : "balanced",
    brand_consistency: o.brand_consistency !== false,
    platform: PLATFORMS.some((x) => x.id === o.platform) ? (o.platform as GenerationOptions["platform"]) : "meta",
  };

  // Server-side credit check for the whole batch (each image is still reserved atomically on its own).
  const needed = count * CREDIT_COST_GENERATED_IMAGE;
  if (auth.profile.ai_credits < needed) {
    return jsonError(402, `This needs ${needed.toLocaleString()} credits and you have ${auth.profile.ai_credits.toLocaleString()}.`, { code: "insufficient_credits", needed, balance: auth.profile.ai_credits });
  }
  if ((await countLast24h(auth.db, "strategy_generations", auth.userId, true)) >= DAILY_BATCH_LIMIT) {
    return jsonError(429, "You've reached today's limit for new generation batches. Try again tomorrow.", { code: "daily_limit" });
  }

  try {
    const specs = await buildVariations({ profile: s.brand_profile, concept, options, count, deadline: t0 + 25_000 });
    const batchId = randomUUID();
    const rows = specs.map((spec, i) => ({
      user_id: auth.userId,
      strategy_id: s.id,
      concept_id: concept.id,
      batch_id: batchId,
      variation: i + 1,
      request_id: `gen:${randomUUID()}`,
      status: "pending",
      spec,
      options,
    }));
    const { data, error } = await auth.db.from("strategy_generations").insert(rows).select(GENERATION_COLUMNS);
    if (error) return jsonError(500, /strategy_generations/.test(error.message) ? "Run supabase/migration-015-creative-strategy.sql first." : "Couldn't prepare the variations.");
    log("batch", { id: s.id, concept: concept.id, count, ms: Date.now() - t0 });
    return NextResponse.json({ generations: await withImageUrls(auth.db, data as never), estimate: needed });
  } catch (e) {
    const code = e instanceof AnalysisError ? e.code : "ai_failed";
    return jsonError(code === "ai_timeout" ? 504 : 502, "The AI couldn't write the variations. No credits were used — please try again.", { code });
  }
}
