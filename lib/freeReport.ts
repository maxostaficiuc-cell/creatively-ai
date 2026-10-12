import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-side eligibility system for the public "Get Your Free Report" flow.
// Deliberately layered rather than relying on any single signal — matches
// the product requirement that no single check (IP, cookie, localStorage)
// is sufficient on its own. None of this is claimed to be unbeatable; it's
// meant to make casual/automated repeat use substantially harder.

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_ATTEMPTS_PER_IP = 3;

export function hashValue(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: "already_used" | "rate_limited" };

export async function checkFreeReportEligibility(params: {
  emailHash: string;
  ipHash: string;
  deviceHash: string;
  cookieTokenHash: string | null;
}): Promise<EligibilityResult> {
  const supabase = createAdminClient();

  // Layer 1: has this exact email, IP, device, or cookie already claimed
  // a report? Any single match blocks it — matching on the strongest
  // available signal rather than requiring all of them at once.
  const orFilter = [
    `email_hash.eq.${params.emailHash}`,
    `ip_hash.eq.${params.ipHash}`,
    `device_hash.eq.${params.deviceHash}`,
  ];
  if (params.cookieTokenHash) orFilter.push(`cookie_token_hash.eq.${params.cookieTokenHash}`);

  const { data: existing } = await supabase
    .from("free_report_claims")
    .select("id")
    .or(orFilter.join(","))
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { eligible: false, reason: "already_used" };
  }

  // Layer 2: basic rate limiting — even with a fresh email/device, don't
  // allow the same IP to attempt many claims in a short window (catches
  // rapid automated attempts using disposable emails).
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("free_report_claims")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", params.ipHash)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS_PER_IP) {
    return { eligible: false, reason: "rate_limited" };
  }

  return { eligible: true };
}

export async function recordFreeReportClaim(params: {
  emailHash: string;
  ipHash: string;
  deviceHash: string;
  cookieTokenHash: string | null;
  creativeId: string | null;
}) {
  const supabase = createAdminClient();
  await supabase.from("free_report_claims").insert({
    email_hash: params.emailHash,
    ip_hash: params.ipHash,
    device_hash: params.deviceHash,
    cookie_token_hash: params.cookieTokenHash,
    creative_id: params.creativeId,
    status: "completed",
  });
}

// ── In-flight lock (migration-009) ──────────────────────────────────────────
// A short-lived 'pending' claim taken before the analysis runs, so a double
// click / parallel request for the same email can't produce two reports.

const PENDING_STALE_MS = 5 * 60 * 1000;

export type PendingLock =
  | { status: "locked"; claimId: string }
  | { status: "in_progress" }
  | { status: "unavailable" }; // migration not run yet → continue without a lock

export async function acquirePendingClaim(params: {
  emailHash: string;
  ipHash: string;
  deviceHash: string;
  cookieTokenHash: string | null;
}): Promise<PendingLock> {
  const supabase = createAdminClient();
  // Clear any stale lock left behind by a crashed request.
  await supabase
    .from("free_report_claims")
    .delete()
    .eq("email_hash", params.emailHash)
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - PENDING_STALE_MS).toISOString());

  const { data, error } = await supabase
    .from("free_report_claims")
    .insert({
      email_hash: params.emailHash,
      ip_hash: params.ipHash,
      device_hash: params.deviceHash,
      cookie_token_hash: params.cookieTokenHash,
      status: "pending",
    })
    .select("id")
    .single();

  if (!error && data) return { status: "locked", claimId: data.id };
  if (error?.code === "23505") return { status: "in_progress" }; // another request holds the lock
  return { status: "unavailable" };
}

export async function completePendingClaim(claimId: string, creativeId: string | null) {
  const supabase = createAdminClient();
  await supabase.from("free_report_claims").update({ status: "completed", creative_id: creativeId }).eq("id", claimId);
}

export async function releasePendingClaim(claimId: string) {
  const supabase = createAdminClient();
  await supabase.from("free_report_claims").delete().eq("id", claimId).eq("status", "pending");
}
