import { NextResponse } from "next/server";
import { generateAdImage, geminiConfigured, ImageGenError } from "@/lib/geminiImage";
import { imagePrompt } from "@/lib/strategyAI";
import { safeFetch } from "@/lib/safeFetch";
import { sniffImageType } from "@/lib/analyzeCreative";
import { CREDIT_COST_GENERATED_IMAGE } from "@/lib/types";
import { GENERATED_BUCKET, jsonError, loadGeneration, loadStrategy, log, requireActiveUser, withImageUrls } from "@/lib/strategyServer";
import { GENERATION_COLUMNS } from "@/lib/strategyTypes";

// Generates ONE image. Credits go through the existing ledger, keyed by this
// generation's request id:
//   reserve (atomic, only if enough credits) → generate → store → settle
//   any failure → release (credits straight back) and the row is marked failed.
// Calling it again for a completed image returns it without charging; calling
// it again after a failure retries under the same request id (still at most
// one charge for the delivered image).
export const runtime = "nodejs";
export const maxDuration = 30;

type RpcResult = { status: string; balance?: number; transaction_id?: string };

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const t0 = Date.now();
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const { db, userId } = auth;
  if (!geminiConfigured()) return jsonError(503, "Image generation isn't set up yet (GEMINI_API_KEY).", { code: "image_not_configured" });

  const g = await loadGeneration(db, params.id, userId);
  if (!g) return jsonError(404, "Not found.");
  if (g.status === "completed") {
    const [out] = await withImageUrls(db, [g]);
    return NextResponse.json({ generation: out, charged: 0, replay: true });
  }

  // Claim the row so two tabs/clicks can't run the same image at once
  // (a "generating" row older than 2 minutes is treated as abandoned).
  const staleBefore = new Date(Date.now() - 120_000).toISOString();
  const claimPatch = { status: "generating", error: null, attempts: (g.attempts ?? 0) + 1, updated_at: new Date().toISOString() };
  let { data: claimed } = await db
    .from("strategy_generations")
    .update(claimPatch)
    .eq("id", g.id)
    .eq("user_id", userId)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (!claimed) {
    ({ data: claimed } = await db
      .from("strategy_generations")
      .update(claimPatch)
      .eq("id", g.id)
      .eq("user_id", userId)
      .eq("status", "generating")
      .lt("updated_at", staleBefore)
      .select("id")
      .maybeSingle());
  }
  if (!claimed) return jsonError(409, "This image is already being generated.", { code: "in_progress" });

  const fail = async (status: number, message: string, code: string, released: boolean) => {
    await db.from("strategy_generations").update({ status: "failed", error: message.slice(0, 300), updated_at: new Date().toISOString() }).eq("id", g.id);
    log("run_failed", { id: g.id, code, ms: Date.now() - t0 });
    return jsonError(status, message, { code, charged: released ? false : null });
  };

  // ── reserve credits ──────────────────────────────────────────────────────
  const { data: r, error: rErr } = await db.rpc("reserve_analysis_credits", {
    p_user_id: userId,
    p_request_id: g.request_id,
    p_amount: CREDIT_COST_GENERATED_IMAGE,
    p_media_type: "generated_image",
  });
  if (rErr) return fail(503, /reserve_analysis_credits/.test(rErr.message) ? "Credits aren't set up (run supabase/migration-011-credit-ledger.sql)." : "Couldn't reserve credits.", "ledger_error", true);
  const res = r as RpcResult;
  if (res.status === "insufficient") return fail(402, `Not enough credits: each image costs ${CREDIT_COST_GENERATED_IMAGE}.`, "insufficient_credits", true);
  if (res.status === "inactive") return fail(402, "Your plan isn't active.", "plan_inactive", true);
  if (res.status === "in_progress") return jsonError(409, "This image is already being generated.", { code: "in_progress" });
  if (res.status !== "reserved" && res.status !== "completed") return fail(500, "Couldn't reserve credits.", "ledger_error", true);

  const release = async () => {
    const { error } = await db.rpc("release_analysis_credits", { p_user_id: userId, p_request_id: g.request_id });
    return !error;
  };

  try {
    const strategy = await loadStrategy(db, g.strategy_id, userId);
    const concept = strategy?.concepts?.find((c) => c.id === g.concept_id);
    if (!strategy?.brand_profile || !concept) {
      const ok = await release();
      return fail(404, "The strategy for this image no longer exists.", "missing_strategy", ok);
    }

    // Brand reference images (from the website) keep products and look consistent.
    const references: { mediaType: string; base64: string }[] = [];
    if (g.options.brand_consistency) {
      for (const u of strategy.brand_profile.reference_images ?? []) {
        if (references.length >= 2 || Date.now() - t0 > 6000) break;
        try {
          const f = await safeFetch(u, { timeoutMs: 3000, maxBytes: 4_000_000, accept: "image/*", deadline: t0 + 7000 });
          const bytes = new Uint8Array(f.body);
          const type = sniffImageType(bytes);
          if (type && type !== "image/gif") references.push({ mediaType: type, base64: Buffer.from(bytes).toString("base64") });
        } catch {
          /* a missing reference never blocks generation */
        }
      }
    }

    const out = await generateAdImage({
      prompt: imagePrompt({ profile: strategy.brand_profile, concept, spec: g.spec, options: g.options }),
      aspectRatio: g.options.aspect_ratio,
      references,
      deadline: t0 + 26_000,
    });

    const ext = out.mime === "image/png" ? "png" : out.mime === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/generated/${g.id}.${ext}`;
    const up = await db.storage.from(GENERATED_BUCKET).upload(path, Buffer.from(out.bytes), { contentType: out.mime, upsert: true });
    if (up.error) {
      const ok = await release();
      return fail(502, "The image was generated but couldn't be stored. No credits were used.", "storage_failed", ok);
    }

    // ── settle: the charge becomes final only now ───────────────────────────
    let settled: RpcResult | null = null;
    for (let i = 0; i < 2 && !settled; i++) {
      const { data, error } = await db.rpc("settle_analysis_credits", { p_user_id: userId, p_request_id: g.request_id, p_creative_id: null });
      if (!error) settled = data as RpcResult;
    }
    const { data: row } = await db
      .from("strategy_generations")
      .update({
        status: "completed",
        image_path: path,
        image_mime: out.mime,
        model: out.model,
        credits_charged: CREDIT_COST_GENERATED_IMAGE,
        credit_transaction_id: settled?.transaction_id ?? null,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", g.id)
      .select(GENERATION_COLUMNS)
      .single();
    log("run_ok", { id: g.id, model: out.model, refs: references.length, ms: Date.now() - t0 });
    const [gen] = await withImageUrls(db, [row as never]);
    return NextResponse.json({ generation: gen, charged: CREDIT_COST_GENERATED_IMAGE, remainingCredits: settled?.balance ?? null });
  } catch (e) {
    const ok = await release();
    const msg = e instanceof ImageGenError ? e.message : "Image generation failed.";
    const code = e instanceof ImageGenError ? e.code : "failed";
    return fail(code === "rate_limited" ? 429 : code === "timeout" ? 504 : 502, `${msg} ${ok ? "No credits were used." : ""}`.trim(), code, ok);
  }
}
