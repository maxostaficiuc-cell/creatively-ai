import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreshProfile } from "@/lib/profile";
import { CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";
import { MAX_AI_IMAGE_BYTES, runCreativeAnalysis, sniffImageType, type AnalysisErrorCode } from "@/lib/analyzeCreative";
import { ANALYZE_ERRORS, type AnalyzeErrorBody, type AnalyzeErrorCode } from "@/lib/analyzeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The authenticated analyze endpoint used by the dashboard.
//
//   validate → reserve credits (atomic) → store file → AI analysis
//            → save report → settle charge          (success: charged once)
//            ↘ any failure → release the reservation (credits go straight back)
//
// Every request carries a requestId from the browser. Retrying with the same
// id never charges twice: a finished request returns its saved report, and a
// running one answers "in_progress". The ledger lives in Postgres
// (supabase/migration-011-credit-ledger.sql); until that migration is run the
// route falls back to the previous charge-after-success behaviour.

/** Netlify stops synchronous functions at 30s; the AI must be done well before. */
const AI_BUDGET_MS = 23_000;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const AI_TO_HTTP: Record<AnalysisErrorCode, { code: AnalyzeErrorCode; status: number }> = {
  ai_not_configured: { code: "ai_unavailable", status: 503 },
  ai_auth: { code: "ai_unavailable", status: 503 },
  ai_quota: { code: "ai_unavailable", status: 503 },
  ai_rate_limited: { code: "rate_limited", status: 429 },
  ai_unavailable: { code: "ai_unavailable", status: 503 },
  ai_timeout: { code: "ai_timeout", status: 504 },
  ai_rejected_image: { code: "ai_rejected_image", status: 422 },
  ai_bad_response: { code: "ai_bad_response", status: 502 },
  ai_failed: { code: "server_error", status: 500 },
};

type Ledger = ReturnType<typeof createAdminClient> | null;
type RpcResult = { status: string; balance?: number; amount?: number; transaction_id?: string; creative_id?: string | null };

function isMissingFunction(err: { code?: string; message?: string } | null) {
  return !!err && (err.code === "PGRST202" || err.code === "42883" || /could not find the function/i.test(err.message ?? ""));
}

export async function POST(request: Request) {
  const t0 = Date.now();
  let requestId: string = randomUUID();
  let uid = "anon";
  // Set once credits are reserved, so even an unexpected crash tries to give them back.
  let releaseOnCrash: (() => Promise<boolean>) | null = null;
  const log = (stage: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ evt: "analyze", rid: requestId, uid, stage, ms: Date.now() - t0, ...extra }));

  const fail = (code: AnalyzeErrorCode, status: number, extra: Partial<AnalyzeErrorBody> = {}) => {
    const def = ANALYZE_ERRORS[code];
    const body: AnalyzeErrorBody = {
      error: def.message,
      code,
      retryable: def.retryable,
      charged: false,
      requestId,
      ...extra,
    };
    log("failed", { code, status, charged: body.charged, retryable: body.retryable });
    return NextResponse.json(body, { status });
  };

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("session_expired", 401);
    uid = user.id.slice(0, 8);

    // ── read + validate the upload ─────────────────────────────────────
    let form: FormData;
    try {
      form = await request.formData();
    } catch (e) {
      log("form_parse_error", { err: String(e).slice(0, 200) });
      return fail("upload_failed", 400);
    }
    const rid = form.get("requestId");
    if (typeof rid === "string" && REQUEST_ID.test(rid)) requestId = rid;
    const file = form.get("file");
    const platform = (form.get("platform") as string) || null;
    if (!(file instanceof File) || file.size === 0) return fail("no_file", 400);

    const isVideo = file.type.startsWith("video/");
    if (isVideo && !VIDEO_TYPES.has(file.type)) return fail("unsupported_type", 415);
    if (file.size > MAX_UPLOAD_BYTES) return fail("file_too_large", 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageType = isVideo ? null : sniffImageType(bytes);
    if (!isVideo && !imageType) return fail("unsupported_type", 415);
    if (!isVideo && bytes.length > MAX_AI_IMAGE_BYTES) return fail("file_too_large", 413);
    const contentType = isVideo ? file.type : (imageType as string);
    const fileType: "image" | "video" = isVideo ? "video" : "image";
    const cost = isVideo ? CREDIT_COST_VIDEO : CREDIT_COST_IMAGE;
    log("received", { type: contentType, bytes: bytes.length });

    // Weekly reset + unpaid guard (single source of truth for the balance).
    const profile = await getFreshProfile(supabase, user.id);
    if (!profile) return fail("session_expired", 401);
    if (profile.subscription_status !== "active") return fail("plan_inactive", 402, { balance: profile.ai_credits });

    let ledger: Ledger = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;

    // ── idempotent replay: this request already produced a report ────────
    {
      const { data: existing, error } = await supabase
        .from("creatives")
        .select("*")
        .eq("user_id", user.id)
        .eq("request_id", requestId)
        .maybeSingle();
      if (!error && existing) {
        log("replay");
        return NextResponse.json({ creative: existing, replay: true, charged: 0, remainingCredits: profile.ai_credits, requestId });
      }
    }

    // ── reserve credits atomically ───────────────────────────────────────
    // Videos are not analyzed by AI yet, so they are never charged.
    let reserved = false;
    if (!isVideo) {
      if (ledger) {
        const { data, error } = await ledger.rpc("reserve_analysis_credits", {
          p_user_id: user.id,
          p_request_id: requestId,
          p_amount: cost,
          p_media_type: fileType,
        });
        if (isMissingFunction(error)) {
          log("ledger_missing", { hint: "run supabase/migration-011-credit-ledger.sql" });
          ledger = null;
        } else if (error) {
          log("reserve_error", { err: error.message });
          return fail("server_error", 500);
        } else {
          const r = data as RpcResult;
          log("reserve", { status: r.status, balance: r.balance });
          if (r.status === "in_progress") return fail("in_progress", 409);
          if (r.status === "insufficient") return fail("insufficient_credits", 402, { balance: r.balance ?? null });
          if (r.status === "inactive") return fail("plan_inactive", 402, { balance: r.balance ?? null });
          if (r.status === "no_profile") return fail("session_expired", 401);
          if (r.status === "completed") {
            const { data: done } = await supabase.from("creatives").select("*").eq("id", r.creative_id ?? "").maybeSingle();
            if (done) return NextResponse.json({ creative: done, replay: true, charged: 0, remainingCredits: r.balance, requestId });
            return fail("in_progress", 409);
          }
          reserved = r.status === "reserved";
        }
      }
      if (!ledger && profile.ai_credits < cost) {
        return fail("insufficient_credits", 402, { balance: profile.ai_credits });
      }
    }

    /** Gives the reserved credits back. Returns false when that could not be confirmed. */
    const release = async (): Promise<boolean> => {
      if (!reserved || !ledger) return true;
      for (let i = 0; i < 2; i++) {
        const { data, error } = await ledger.rpc("release_analysis_credits", { p_user_id: user.id, p_request_id: requestId });
        if (!error) {
          log("released", { status: (data as RpcResult)?.status, balance: (data as RpcResult)?.balance });
          reserved = false;
          return true;
        }
        log("release_error", { attempt: i + 1, err: error.message });
      }
      return false; // stale-reservation cleanup will still refund it within minutes
    };
    releaseOnCrash = release;
    const failAfterReserve = async (code: AnalyzeErrorCode, status: number, extra: Partial<AnalyzeErrorBody> = {}) => {
      const ok = await release();
      return fail(code, status, { ...extra, charged: ok ? false : null });
    };

    // ── store the file under the user's own folder ───────────────────────
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("creatives")
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) {
      log("storage_error", { err: uploadError.message });
      return failAfterReserve("storage_failed", 502);
    }
    const { data: signed } = await supabase.storage.from("creatives").createSignedUrl(path, 60 * 60 * 24 * 365);
    const fileUrl = signed?.signedUrl ?? path;
    log("stored");

    // ── analysis ─────────────────────────────────────────────────────────
    let finalResult: Record<string, unknown> & { score: number; summary: string; whats_working: string; whats_not: string; what_to_test: string };
    let isSimulated: boolean;
    if (isVideo) {
      // Video analysis isn't built yet — a clearly labelled placeholder, never charged.
      finalResult = {
        score: 30 + Math.floor(Math.random() * 60),
        summary: "Video analysis is simulated for now — real video AI analysis is a larger feature.",
        whats_working: "This is a placeholder result because video isn't analyzed yet.",
        whats_not: "No real creative analysis has been performed on this video.",
        what_to_test: "Upload an image instead for a real AI-powered analysis.",
      };
      isSimulated = true;
    } else {
      const ai = await runCreativeAnalysis(bytes, contentType, { deadline: t0 + AI_BUDGET_MS });
      log("ai_done", {
        ok: !ai.isSimulated,
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        aiMs: ai.meta?.ms,
        parts: ai.meta?.parts,
        code: ai.error?.code,
      });
      if (ai.isSimulated) {
        // No real analysis: don't save a placeholder, don't charge.
        await supabase.storage.from("creatives").remove([path]).catch(() => {});
        const map = AI_TO_HTTP[ai.error?.code ?? "ai_failed"];
        const ref = `${ai.error?.part || "ai"}:${ai.error?.reason || ai.error?.code || "failed"}`;
        return failAfterReserve(map.code, map.status, { retryAfter: ai.error?.retryAfterSec ?? null, ref });
      }
      finalResult = ai.result as unknown as typeof finalResult;
      isSimulated = false;
    }

    // ── save the report ──────────────────────────────────────────────────
    const charged = isSimulated ? 0 : cost;
    const row: Record<string, unknown> = {
      user_id: user.id,
      file_url: fileUrl,
      file_type: fileType,
      platform,
      score: finalResult.score,
      summary: finalResult.summary,
      whats_working: finalResult.whats_working,
      whats_not: finalResult.whats_not,
      what_to_test: finalResult.what_to_test,
      credits_used: charged,
      is_simulated: isSimulated,
      report: finalResult,
    };
    if (ledger) row.request_id = requestId;

    const { data: creative, error: insertError } = await supabase.from("creatives").insert(row).select().single();
    if (insertError || !creative) {
      log("save_error", { err: insertError?.message });
      await supabase.storage.from("creatives").remove([path]).catch(() => {});
      return failAfterReserve("save_failed", 500);
    }
    log("saved", { creativeId: creative.id });

    // ── settle the charge ────────────────────────────────────────────────
    let remaining = profile.ai_credits;
    let transactionId: string | null = null;
    if (charged > 0 && reserved && ledger) {
      let settled: RpcResult | null = null;
      for (let i = 0; i < 2 && !settled; i++) {
        const { data, error } = await ledger.rpc("settle_analysis_credits", {
          p_user_id: user.id,
          p_request_id: requestId,
          p_creative_id: creative.id,
        });
        if (error) log("settle_error", { attempt: i + 1, err: error.message });
        else settled = data as RpcResult;
      }
      remaining = settled?.balance ?? remaining - charged;
      transactionId = settled?.transaction_id ?? null;
      log("settled", { status: settled?.status ?? "unconfirmed", balance: remaining });
    } else if (charged > 0) {
      // Pre-migration fallback: conditional write so two requests can't both spend the same credits.
      const db = ledger ?? (process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase);
      const { data: upd, error: updErr } = await db
        .from("profiles")
        .update({ ai_credits: profile.ai_credits - charged })
        .eq("id", user.id)
        .eq("ai_credits", profile.ai_credits)
        .select("ai_credits")
        .maybeSingle();
      remaining = upd?.ai_credits ?? profile.ai_credits;
      log("legacy_charge", { ok: !!upd, err: updErr?.message, balance: remaining });
      if (!upd) {
        // The balance changed under us; read it back so the UI stays truthful.
        const { data: p } = await db.from("profiles").select("ai_credits").eq("id", user.id).maybeSingle();
        remaining = p?.ai_credits ?? remaining;
      }
    }

    log("done", { charged, balance: remaining });
    return NextResponse.json({
      creative,
      remainingCredits: remaining,
      charged,
      transactionId: transactionId ?? (charged > 0 ? requestId : null),
      requestId,
      replay: false,
    });
  } catch (e) {
    console.error(JSON.stringify({ evt: "analyze", rid: requestId, uid, stage: "unhandled", err: String(e).slice(0, 400) }));
    // Give back any reserved credits. If even that fails, the stale-reservation
    // cleanup returns them within minutes, but we can't promise it here.
    const ok = releaseOnCrash ? await releaseOnCrash().catch(() => false) : true;
    return fail("server_error", 500, { charged: ok ? false : null });
  }
}
