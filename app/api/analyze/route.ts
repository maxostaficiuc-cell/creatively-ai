import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { recordSystemEvent } from "@/lib/systemEvents";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreshProfile } from "@/lib/profile";
import { CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";
import { AnalysisError, MAX_AI_IMAGE_BYTES, analyzeVideoWithClaudeMeta, runCreativeAnalysis, sniffImageType, type AnalysisErrorCode, type CreativeReport, type VideoFrame } from "@/lib/analyzeCreative";
import { analyzeVideoAudio, MAX_INLINE_VIDEO_BYTES } from "@/lib/videoAudio";
import { ANALYZE_ERRORS, MAX_VIDEO_BYTES, type AnalyzeErrorBody, type AnalyzeErrorCode } from "@/lib/analyzeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// The authenticated analyze endpoint used by the dashboard (images and videos).
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
const MAX_FRAMES = 8;
const MAX_FRAME_BYTES = 1.5 * 1024 * 1024;

/** mp4 / mov ("ftyp" box) or webm (EBML header), from the file's bytes. */
function sniffVideoType(b: Uint8Array): "video/mp4" | "video/quicktime" | "video/webm" | null {
  if (b.length < 12) return null;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }
  return null;
}

const AI_TO_HTTP: Record<AnalysisErrorCode, { code: AnalyzeErrorCode; status: number }> = {
  // Configuration / account problems: retrying can't fix these.
  ai_not_configured: { code: "ai_config", status: 503 },
  ai_auth: { code: "ai_config", status: 503 },
  ai_quota: { code: "ai_config", status: 503 },
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
  let userId: string | null = null;
  // Set once credits are reserved, so even an unexpected crash tries to give them back.
  let releaseOnCrash: (() => Promise<boolean>) | null = null;
  const log = (stage: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ evt: "analyze", rid: requestId, uid, stage, ms: Date.now() - t0, ...extra }));

  const fail = async (code: AnalyzeErrorCode, status: number, extra: Partial<AnalyzeErrorBody> = {}) => {
    const def = ANALYZE_ERRORS[code];
    // Server-side and AI-provider failures go to the admin System Health log
    // (ids and codes only — never the upload or the report).
    // extra.ref is set only for AI-provider failures ("part:reason", our own diagnostic tag).
    if (status >= 500 || code.startsWith("ai_") || extra.ref || extra.charged === null) {
      await recordSystemEvent({
        category: extra.ref || code.startsWith("ai_") ? "ai_provider" : "analysis",
        source: "api/analyze",
        code,
        message: `Analysis failed (${code}, HTTP ${status}${extra.ref ? `, ${extra.ref}` : ""})${extra.charged === null ? "; credit refund not confirmed, stale-reservation cleanup will return it" : ""}.`,
        userId: userId ?? null,
        refId: requestId,
      });
    }
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
    userId = user.id;

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
    const platform = (form.get("platform") as string) || null;

    // Videos are uploaded by the browser straight to the user's own storage
    // folder (too large for this request); the request carries the storage
    // path, the sampled frames with their timestamps, and the measured length.
    const videoPathRaw = form.get("videoPath");
    const isVideo = typeof videoPathRaw === "string" && videoPathRaw.length > 0;
    let bytes = new Uint8Array();
    let contentType = "";
    let path = "";
    let frames: VideoFrame[] = [];
    let videoMeta = { duration: 0, width: 0, height: 0 };
    let videoSize = 0;
    if (isVideo) {
      path = videoPathRaw as string;
      const own = new RegExp(`^${user.id}/videos/[A-Za-z0-9._-]{1,120}$`);
      if (!own.test(path)) return fail("no_file", 400);
      const num = (k: string) => Number(form.get(k));
      videoMeta = { duration: num("duration"), width: Math.round(num("width")), height: Math.round(num("height")) };
      if (!(videoMeta.duration > 0 && videoMeta.duration <= 3600) || !(videoMeta.width > 0) || !(videoMeta.height > 0)) return fail("video_unreadable", 422);
      let times: unknown;
      try {
        times = JSON.parse(String(form.get("frameTimes") ?? "[]"));
      } catch {
        times = null;
      }
      const frameFiles = form.getAll("frames").filter((f): f is File => f instanceof File && f.size > 0);
      if (!Array.isArray(times) || frameFiles.length === 0 || frameFiles.length > MAX_FRAMES || times.length !== frameFiles.length) return fail("video_unreadable", 422);
      for (let i = 0; i < frameFiles.length; i++) {
        const t = Number(times[i]);
        if (!Number.isFinite(t) || t < 0 || t > videoMeta.duration + 0.5 || frameFiles[i].size > MAX_FRAME_BYTES) return fail("video_unreadable", 422);
        const fb = new Uint8Array(await frameFiles[i].arrayBuffer());
        const ft = sniffImageType(fb);
        if (!ft || ft === "image/gif") return fail("video_unreadable", 422);
        frames.push({ t, base64: Buffer.from(fb).toString("base64"), mediaType: ft });
      }
      frames = frames.sort((a, b) => a.t - b.t);
      // The video must really be in this user's folder (RLS also enforces it).
      const folder = path.slice(0, path.lastIndexOf("/"));
      const name = path.slice(path.lastIndexOf("/") + 1);
      const { data: listing, error: listErr } = await supabase.storage.from("creatives").list(folder, { search: name, limit: 5 });
      const obj = listing?.find((o) => o.name === name);
      if (listErr || !obj) {
        log("video_missing", { err: listErr?.message });
        return fail("storage_failed", 502);
      }
      videoSize = Number((obj.metadata as Record<string, unknown> | null)?.size ?? 0);
      if (videoSize > MAX_VIDEO_BYTES) return fail("file_too_large", 413);
      // Audio is analyzed from the file itself; that needs the bytes (only up to the provider's inline limit).
      if (videoSize > 0 && videoSize <= MAX_INLINE_VIDEO_BYTES) {
        const { data: blob, error: dlErr } = await supabase.storage.from("creatives").download(path);
        if (dlErr || !blob) {
          log("video_download_error", { err: dlErr?.message });
          return fail("storage_failed", 502);
        }
        bytes = new Uint8Array(await blob.arrayBuffer());
      }
      const head = bytes.length ? bytes : null;
      const sniffed = head ? sniffVideoType(head) : null;
      const declared = (obj.metadata as Record<string, unknown> | null)?.mimetype;
      contentType = sniffed ?? (typeof declared === "string" && VIDEO_TYPES.has(declared) ? declared : "");
      if (!contentType || (head && !sniffed)) return fail("unsupported_type", 415);
    } else {
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) return fail("no_file", 400);
      // Older pages posted videos here directly; videos now go through storage.
      if (file.type.startsWith("video/")) return fail("unsupported_type", 415);
      if (file.size > MAX_UPLOAD_BYTES) return fail("file_too_large", 413);
      bytes = new Uint8Array(await file.arrayBuffer());
      const imageType = sniffImageType(bytes);
      if (!imageType) return fail("unsupported_type", 415);
      if (bytes.length > MAX_AI_IMAGE_BYTES) return fail("file_too_large", 413);
      contentType = imageType;
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
      path = `${user.id}/${Date.now()}-${safeName}`;
    }
    const fileType: "image" | "video" = isVideo ? "video" : "image";
    const cost = isVideo ? CREDIT_COST_VIDEO : CREDIT_COST_IMAGE;
    log("received", { type: contentType, bytes: isVideo ? videoSize : bytes.length, frames: frames.length || undefined });

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
    let reserved = false;
    {
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

    // ── store the file under the user's own folder (videos are already there) ──
    if (!isVideo) {
      const { error: uploadError } = await supabase.storage
        .from("creatives")
        .upload(path, bytes, { contentType, upsert: false });
      if (uploadError) {
        log("storage_error", { err: uploadError.message });
        return failAfterReserve("storage_failed", 502);
      }
    }
    const { data: signed } = await supabase.storage.from("creatives").createSignedUrl(path, 60 * 60 * 24 * 365);
    const fileUrl = signed?.signedUrl ?? path;
    log("stored");

    // ── analysis ─────────────────────────────────────────────────────────
    // Only a real, complete analysis is ever saved or charged. If the AI
    // fails, nothing is saved, the reserved credits go back, and the user gets
    // an error — never a placeholder report.
    let finalResult: CreativeReport;
    if (isVideo) {
      const deadline = t0 + AI_BUDGET_MS;
      const [visual, audio] = await Promise.all([
        analyzeVideoWithClaudeMeta(frames, videoMeta, { deadline }).then(
          (r) => ({ ok: true as const, ...r }),
          (e: unknown) => ({ ok: false as const, error: e instanceof AnalysisError ? e : new AnalysisError("ai_failed", String(e)) })
        ),
        bytes.length
          ? analyzeVideoAudio({ bytes, mime: contentType, duration: videoMeta.duration, deadline })
          : Promise.resolve({
              status: "not_analyzed" as const,
              note: `Audio was not analyzed: this video is larger than ${Math.round(MAX_INLINE_VIDEO_BYTES / 1048576)} MB, the limit for audio analysis.`,
              speech: false,
              transcript: [],
              spoken_hook: "",
              sound: "",
              consistency: "",
              error: "too_large",
            }),
      ]);
      log("ai_done", {
        kind: "video",
        ok: visual.ok,
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        aiMs: visual.ok ? visual.meta.ms : undefined,
        parts: visual.ok ? visual.meta.parts : undefined,
        code: visual.ok ? undefined : visual.error.code,
        audio: audio.status,
        audioErr: "error" in audio ? audio.error : undefined,
      });
      if (!visual.ok) {
        // The upload stays in the user's folder so "Try again" doesn't re-upload it.
        const map = AI_TO_HTTP[visual.error.code ?? "ai_failed"];
        const ref = `${visual.error.part || "ai"}:${visual.error.reason || visual.error.code || "failed"}`;
        return failAfterReserve(map.code, map.status, { retryAfter: visual.error.retryAfterSec ?? null, ref });
      }
      const { error: _e, ...audioResult } = audio as typeof audio & { error?: string };
      finalResult = { ...visual.report, video: { ...visual.report.video!, audio: audioResult } };
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
        // No real analysis: don't save anything, don't charge.
        await supabase.storage.from("creatives").remove([path]).catch(() => {});
        const map = AI_TO_HTTP[ai.error?.code ?? "ai_failed"];
        const ref = `${ai.error?.part || "ai"}:${ai.error?.reason || ai.error?.code || "failed"}`;
        return failAfterReserve(map.code, map.status, { retryAfter: ai.error?.retryAfterSec ?? null, ref });
      }
      finalResult = ai.result;
    }

    // ── save the report ──────────────────────────────────────────────────
    const charged = cost;
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
      is_simulated: false,
      report: finalResult,
    };
    if (ledger) row.request_id = requestId;

    const { data: creative, error: insertError } = await supabase.from("creatives").insert(row).select().single();
    if (insertError || !creative) {
      log("save_error", { err: insertError?.message });
      if (!isVideo) await supabase.storage.from("creatives").remove([path]).catch(() => {});
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
