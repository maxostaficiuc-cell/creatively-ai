import { NextResponse } from "next/server";
import { GENERATED_BUCKET, jsonError, loadGeneration, loadStrategy, log, requireActiveUser } from "@/lib/strategyServer";
import { ASPECT_RATIOS, PLATFORMS } from "@/lib/strategyTypes";

// Save a generated ad to My Creatives (the existing creatives table). It is
// saved as a generated creative — no score, not labelled as a winner — with
// its copy, concept and strategy attached. Saving twice returns the same item.
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const g = await loadGeneration(auth.db, params.id, auth.userId);
  if (!g) return jsonError(404, "Not found.");
  if (g.status !== "completed" || !g.image_path) return jsonError(409, "Only finished images can be saved.");
  if (g.saved_creative_id) return NextResponse.json({ creativeId: g.saved_creative_id, replay: true });

  const strategy = await loadStrategy(auth.db, g.strategy_id, auth.userId);
  const concept = strategy?.concepts?.find((c) => c.id === g.concept_id);
  const { data: signed } = await auth.db.storage.from(GENERATED_BUCKET).createSignedUrl(g.image_path, 60 * 60 * 24 * 365);
  const platform = `AI-generated · ${PLATFORMS.find((p) => p.id === g.options.platform)?.label ?? "Meta"} · ${ASPECT_RATIOS.find((a) => a.id === g.options.aspect_ratio)?.id ?? ""}`;
  const { data, error } = await auth.db
    .from("creatives")
    .insert({
      user_id: auth.userId,
      file_url: signed?.signedUrl ?? g.image_path,
      file_type: "image",
      platform,
      score: null,
      summary: g.spec.headline,
      credits_used: g.credits_charged,
      is_simulated: false,
      report: null,
      source: "generated",
      strategy_id: g.strategy_id,
      generation_id: g.id,
      ad_copy: {
        headline: g.spec.headline,
        primary_text: g.spec.primary_text,
        cta: g.spec.cta,
        concept: concept ? { name: concept.name, angle: concept.angle, audience: concept.audience } : null,
        brand: strategy?.brand_name ?? null,
        aspect_ratio: g.options.aspect_ratio,
        style: g.options.style,
      },
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await auth.db.from("creatives").select("id").eq("generation_id", g.id).maybeSingle();
      if (existing) return NextResponse.json({ creativeId: existing.id, replay: true });
    }
    return jsonError(500, "Couldn't save to My Creatives.");
  }
  await auth.db.from("strategy_generations").update({ saved_creative_id: data.id }).eq("id", g.id);
  log("saved", { gen: g.id, creative: data.id });
  return NextResponse.json({ creativeId: data.id });
}
