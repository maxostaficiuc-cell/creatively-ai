import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCreativeAnalysis } from "@/lib/analyzeCreative";
import {
  hashValue,
  getClientIp,
  checkFreeReportEligibility,
  recordFreeReportClaim,
} from "@/lib/freeReport";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const COOKIE_NAME = "cai_frt";

type ErrorCode =
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "VIDEO_NOT_ALLOWED"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT"
  | "ALREADY_USED"
  | "UPLOAD_ERROR"
  | "ANALYSIS_ERROR"
  | "MISSING_CONFIGURATION";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_FILE: "Please upload a supported image format (JPG, PNG, or WEBP).",
  FILE_TOO_LARGE: "This creative is too large. Please upload a file under 8MB.",
  VIDEO_NOT_ALLOWED: "Video analysis is available on paid plans.",
  VALIDATION_ERROR: "Please check your name and email and try again.",
  RATE_LIMIT: "You've reached the current analysis limit. Please try again later.",
  ALREADY_USED: "You've already used your free report.",
  UPLOAD_ERROR: "Your image could not be uploaded. Please try again.",
  ANALYSIS_ERROR: "We couldn't complete the analysis. Your creative is safe — please try again.",
  MISSING_CONFIGURATION: "Analysis is temporarily unavailable. Please try again shortly.",
};

function fail(code: ErrorCode, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ code, error: ERROR_MESSAGES[code], ...extra }, { status });
}

export async function POST(request: Request) {
  // Fail loud and specific, not with a raw crash, if required config is
  // missing — per the explicit requirement not to silently pretend this
  // works when it can't.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("free-report: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
    return fail("MISSING_CONFIGURATION", 503, {
      missingEnvVar: !process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "SUPABASE_SERVICE_ROLE_KEY"
        : "NEXT_PUBLIC_SUPABASE_URL",
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("free-report: failed to parse form data:", err);
    return fail("UPLOAD_ERROR", 400);
  }

  const file = formData.get("file") as File | null;
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const deviceFingerprint = (formData.get("device") as string) || "";
  const turnstileToken = (formData.get("turnstileToken") as string) || null;

  if (!name) return fail("VALIDATION_ERROR", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("VALIDATION_ERROR", 400);
  if (!file || file.size === 0) return fail("INVALID_FILE", 400);
  if (!file.type.startsWith("image/")) return fail("VIDEO_NOT_ALLOWED", 400);
  if (file.size > MAX_BYTES) return fail("FILE_TOO_LARGE", 400);

  try {
    const turnstileOk = await verifyTurnstileToken(turnstileToken);
    if (!turnstileOk) return fail("VALIDATION_ERROR", 400);
  } catch (err) {
    console.error("free-report: turnstile verification threw:", err);
    // Don't hard-block real users over a bot-check outage — proceed.
  }

  const ip = getClientIp(request);
  const ipHash = hashValue(ip);
  const emailHash = hashValue(email);
  const deviceHash = hashValue(deviceFingerprint || "unknown-device");

  const cookieHeader = request.headers.get("cookie") || "";
  const existingCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
  const cookieToken = existingCookie || crypto.randomUUID();
  const cookieTokenHash = hashValue(cookieToken);

  let eligibility;
  try {
    eligibility = await checkFreeReportEligibility({
      emailHash,
      ipHash,
      deviceHash,
      cookieTokenHash,
    });
  } catch (err) {
    console.error("free-report: eligibility check failed:", err);
    return fail("MISSING_CONFIGURATION", 503);
  }

  if (!eligibility.eligible) {
    return eligibility.reason === "rate_limited" ? fail("RATE_LIMIT", 429) : fail("ALREADY_USED", 403);
  }

  let bytes: Uint8Array;
  try {
    const arrayBuffer = await file.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error("free-report: failed to read file bytes:", err);
    return fail("UPLOAD_ERROR", 400);
  }

  let analysis;
  try {
    analysis = await runCreativeAnalysis(bytes, file.type);
  } catch (err) {
    // runCreativeAnalysis already catches AI failures internally and
    // returns a simulated result — reaching this catch means something
    // more fundamental broke (e.g. it threw synchronously), which
    // shouldn't normally happen, but fail cleanly if it does.
    console.error("free-report: analysis threw unexpectedly:", err);
    return fail("ANALYSIS_ERROR", 500);
  }
  const { result, isSimulated } = analysis;

  const supabase = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `free-reports/${Date.now()}-${safeName}`;

  let fileUrl: string | null = null;
  try {
    const { error: uploadError } = await supabase.storage
      .from("creatives")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("free-report: storage upload failed:", uploadError.message);
    } else {
      const { data: signedUrlData } = await supabase.storage
        .from("creatives")
        .createSignedUrl(path, 60 * 60 * 24 * 30);
      fileUrl = signedUrlData?.signedUrl ?? null;
    }
  } catch (err) {
    console.error("free-report: storage step threw:", err);
    // Continue without a stored image rather than failing the whole
    // report — the analysis itself already succeeded.
  }

  let creativeId: string | null = null;
  try {
    const { data: creative, error: insertError } = await supabase
      .from("creatives")
      .insert({
        user_id: null,
        file_url: fileUrl,
        file_type: "image",
        is_free_report: true,
        lead_name: name,
        lead_email: email,
        score: result.score,
        summary: result.summary,
        whats_working: result.whats_working,
        whats_not: result.whats_not,
        what_to_test: result.what_to_test,
        report: result,
        credits_used: 0,
        is_simulated: isSimulated,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("free-report: creative insert failed:", insertError.message);
      return fail("ANALYSIS_ERROR", 500);
    }
    creativeId = creative.id;
  } catch (err) {
    console.error("free-report: creative insert threw:", err);
    return fail("ANALYSIS_ERROR", 500);
  }

  try {
    await recordFreeReportClaim({
      emailHash,
      ipHash,
      deviceHash,
      cookieTokenHash,
      creativeId,
    });
  } catch (err) {
    // The report itself succeeded and was saved — don't fail the request
    // over the claim-tracking write, just log it for follow-up.
    console.error("free-report: failed to record claim:", err);
  }

  const response = NextResponse.json({ reportId: creativeId, isSimulated });
  response.cookies.set(COOKIE_NAME, cookieToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
