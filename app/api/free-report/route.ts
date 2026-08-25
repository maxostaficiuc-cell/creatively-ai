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
const COOKIE_NAME = "cai_frt"; // free-report token — random, first-party, httpOnly

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const deviceFingerprint = (formData.get("device") as string) || "";
  const turnstileToken = (formData.get("turnstileToken") as string) || null;

  // Basic validation — never generate a report on invalid input.
  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "Please upload an image." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Video analysis is available on paid plans.", videoBlocked: true },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large — please use a file under 8MB." }, { status: 400 });
  }

  const turnstileOk = await verifyTurnstileToken(turnstileToken);
  if (!turnstileOk) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  // Layered identity signals — hashed, never stored raw.
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

  const eligibility = await checkFreeReportEligibility({
    emailHash,
    ipHash,
    deviceHash,
    cookieTokenHash,
  });

  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        error:
          eligibility.reason === "rate_limited"
            ? "Too many attempts. Please try again later."
            : "You've already used your free report.",
        alreadyUsed: eligibility.reason === "already_used",
      },
      { status: 403 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const { result, isSimulated } = await runCreativeAnalysis(bytes, file.type);

  // Store the free-report lead + creative for our own records (not
  // publicly re-fetchable — RLS has no public select policy on this row).
  const supabase = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `free-reports/${Date.now()}-${safeName}`;

  let fileUrl: string | null = null;
  const { error: uploadError } = await supabase.storage
    .from("creatives")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (!uploadError) {
    const { data: signedUrlData } = await supabase.storage
      .from("creatives")
      .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days is plenty for a one-time free report
    fileUrl = signedUrlData?.signedUrl ?? null;
  }

  const { data: creative } = await supabase
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

  await recordFreeReportClaim({
    emailHash,
    ipHash,
    deviceHash,
    cookieTokenHash,
    creativeId: creative?.id ?? null,
  });

  const response = NextResponse.json({ report: result, isSimulated, previewUrl: fileUrl });
  response.cookies.set(COOKIE_NAME, cookieToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return response;
}
