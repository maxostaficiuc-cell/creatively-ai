import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { weeklyAllowanceFor } from "@/lib/types";
import { ourPlanFromWhopPlanId } from "@/lib/whop-plans";

// Real Whop webhook handling — verifies the signature per the Standard
// Webhooks spec Whop uses, then updates the paying user's plan and resets
// their weekly credits.
//
// IMPORTANT HISTORY: this previously called `getWhop().webhooks.unwrap(...)`
// from @whop/sdk. As of Whop's current docs, `webhooks.unwrap` and the
// `webhookKey` client option "belonged to the older SDKs — every current
// SDK drops both." That method call was throwing on every single delivery
// (caught by our try/catch, returned as a 401), which is exactly why every
// webhook delivery was failing. This version verifies the signature
// manually using Node's built-in crypto — no dependency on the SDK's
// webhook helpers at all, so it can't break again the same way if that
// package's API surface shifts again (it has, multiple times, during this
// build).
//
// Since checkout happens via plain Whop-hosted checkout links (not an
// API-created session), we don't have our own metadata.userId attached to
// the purchase. Instead we match the buyer back to a Creatively.ai account
// by email — Whop includes the buyer's email on every payment and
// membership webhook. This means a customer must check out with the same
// email they signed up with for their plan to update automatically.
export const runtime = "nodejs";

type WhopEvent = { id: string; type: string; data: Record<string, unknown> };
type WhopUser = { email?: string };

const MAX_TIMESTAMP_AGE_SECONDS = 5 * 60; // replay-attack protection, per Whop's own spec

/**
 * Verifies a Whop webhook per the Standard Webhooks spec:
 * HMAC-SHA256 over "{webhook-id}.{webhook-timestamp}.{raw body}", using the
 * ws_... secret as-is (not base64-decoded, not prefix-stripped — Whop's
 * docs are explicit that the helper/HMAC key is the raw secret string).
 * Returns the parsed event on success, or null if verification fails for
 * any reason (missing headers, bad signature, stale timestamp).
 */
function verifyAndParseWhopWebhook(rawBody: string, headers: Headers, secret: string): WhopEvent | null {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) return null;

  const timestampSeconds = parseInt(webhookTimestamp, 10);
  if (Number.isNaN(timestampSeconds)) return null;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TIMESTAMP_AGE_SECONDS) return null;

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", secret).update(signedContent).digest("base64");

  // Header can contain multiple space-separated "v1,<sig>" entries (key
  // rotation) — a match against any of them is valid.
  const providedSignatures = webhookSignature
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter((sig): sig is string => !!sig);

  const isValid = providedSignatures.some((sig) => {
    try {
      const a = Buffer.from(sig, "base64");
      const b = Buffer.from(expectedSignature, "base64");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });

  if (!isValid) return null;

  try {
    return JSON.parse(rawBody) as WhopEvent;
  } catch {
    return null;
  }
}

async function alreadyProcessed(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("webhook_events").select("id").eq("id", id).maybeSingle();
  return !!data;
}

async function markProcessed(id: string, type: string) {
  const supabase = createAdminClient();
  // A duplicate-key error here just means a concurrent retry already
  // recorded this same event — harmless, not logged as a failure.
  await supabase.from("webhook_events").insert({ id, type });
}

function readEmail(data: Record<string, unknown>): string | null {
  const user = data.user as WhopUser | undefined;
  return user?.email ?? null;
}

function readPlanId(data: Record<string, unknown>): string | null {
  const plan = data.plan as { id?: string } | undefined;
  return plan?.id ?? null;
}

/**
 * The membership id (mem_...) is needed later to actually cancel via
 * Whop's API. Payload shape differs slightly between event types — for
 * membership.activated, `data` IS the membership object (id at the top
 * level); for payment.succeeded it may be nested. Checked defensively
 * rather than assuming one exact shape.
 */
function readMembershipId(data: Record<string, unknown>): string | null {
  const nested = data.membership as { id?: string } | undefined;
  if (nested?.id) return nested.id;
  if (typeof data.membership_id === "string") return data.membership_id;
  if (typeof data.id === "string" && data.id.startsWith("mem_")) return data.id;
  return null;
}

async function grantPlanByEmail(email: string, planId: string, membershipId: string | null): Promise<boolean> {
  const supabase = createAdminClient();
  const allowance = weeklyAllowanceFor(planId);
  const nextReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) return false;

  // This is the ONLY place in the codebase that sets subscription_status
  // to 'active' — reachable only after this route has verified a real
  // Whop webhook signature. Nothing client-facing (onboarding, signup,
  // the checkout redirect page) is allowed to grant paid access.
  const update: Record<string, unknown> = {
    plan: planId,
    subscription_status: "active",
    ai_credits: allowance,
    credits_reset_at: nextReset,
    // A fresh grant/renewal always clears any pending cancellation —
    // covers both a brand-new subscription and a renewal after the user
    // changed their mind and resubscribed.
    cancel_at_period_end: false,
  };
  if (membershipId) update.whop_membership_id = membershipId;

  await supabase.from("profiles").update(update).eq("id", profile.id);

  return true;
}

async function revokeByEmail(email: string, status: "cancelled" | "past_due"): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) return false;

  await supabase
    .from("profiles")
    .update({ subscription_status: status, ai_credits: 0, cancel_at_period_end: false })
    .eq("id", profile.id);

  return true;
}

export async function POST(request: Request) {
  const receivedAt = new Date().toISOString();

  if (!process.env.WHOP_WEBHOOK_SECRET) {
    // Log-only detail, never exposed to the caller.
    console.error(`[whop-webhook ${receivedAt}] WHOP_WEBHOOK_SECRET is not configured`);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // Raw text, not parsed JSON — parsing first changes the exact bytes the
  // signature was computed over, and verification would fail even for a
  // genuinely valid delivery.
  const rawBody = await request.text();

  const event = verifyAndParseWhopWebhook(rawBody, request.headers, process.env.WHOP_WEBHOOK_SECRET);

  if (!event) {
    // Deliberately generic to the caller (never confirms *why* — missing
    // header vs bad signature vs stale timestamp — since that detail is
    // only useful to us, logged below, and not to a potential attacker).
    console.error(`[whop-webhook ${receivedAt}] signature verification failed`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[whop-webhook ${receivedAt}] verified event ${event.id} (${event.type})`);

  if (await alreadyProcessed(event.id)) {
    console.log(`[whop-webhook ${receivedAt}] ${event.id} already processed — skipping (idempotent)`);
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (event.type === "payment.succeeded" || event.type === "membership.activated") {
      const email = readEmail(event.data);
      const whopPlanId = readPlanId(event.data);
      const ourPlan = whopPlanId ? ourPlanFromWhopPlanId(whopPlanId) : null;
      const membershipId = readMembershipId(event.data);

      if (email && ourPlan) {
        const matched = await grantPlanByEmail(email, ourPlan, membershipId);
        console.log(
          `[whop-webhook ${receivedAt}] ${event.id}: ${matched ? "granted" : "no matching account for"} plan ${ourPlan}`
        );
      } else if (!ourPlan) {
        console.error(`[whop-webhook ${receivedAt}] ${event.id}: unrecognized plan_id ${whopPlanId}`);
      } else {
        console.error(`[whop-webhook ${receivedAt}] ${event.id}: no email on payload`);
      }
    } else if (event.type === "membership.deactivated") {
      const email = readEmail(event.data);
      if (email) {
        const matched = await revokeByEmail(email, "cancelled");
        console.log(`[whop-webhook ${receivedAt}] ${event.id}: ${matched ? "revoked" : "no matching account for"} access`);
      }
    } else if (event.type === "payment.failed") {
      // No account change — an unpaid account was never granted access in
      // the first place, so there's nothing to revoke. Logged so failed
      // charges are visible without exposing payment details.
      console.log(`[whop-webhook ${receivedAt}] ${event.id}: payment.failed, no account change`);
    } else if (event.type === "payment.pending") {
      // Same — access is only granted on a confirmed success event, never
      // on pending.
      console.log(`[whop-webhook ${receivedAt}] ${event.id}: payment.pending, no account change`);
    } else {
      console.log(`[whop-webhook ${receivedAt}] ${event.id}: no handler for event type ${event.type}, ignoring`);
    }

    await markProcessed(event.id, event.type);
  } catch (err) {
    console.error(`[whop-webhook ${receivedAt}] ${event.id}: handler threw:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
