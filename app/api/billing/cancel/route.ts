import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Real, server-side cancellation — schedules the user's Whop membership to
// cancel at the end of the current billing period (reversible, matches
// Whop's own default cancellation behavior). This does NOT immediately
// revoke access, deduct credits, or change subscription_status — access
// is preserved until Whop's own membership.deactivated webhook fires at
// the natural end of the period, which is handled by the existing webhook
// route exactly as it already was.
//
// Uses Whop's REST API directly (not the @whop/sdk package) — consistent
// with how webhook verification was fixed earlier in this build, since
// that package's API surface has shifted multiple times during
// development. PATCH /v1/memberships/{id} with cancel_at_period_end is
// the current, documented, reversible way to do this.
export const runtime = "nodejs";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!process.env.WHOP_COMPANY_API_KEY) {
    console.error("billing/cancel: WHOP_COMPANY_API_KEY is not configured");
    return NextResponse.json({ error: "Cancellation is temporarily unavailable." }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, whop_membership_id, cancel_at_period_end")
    .eq("id", user.id)
    .single();

  if (!profile || profile.subscription_status !== "active") {
    return NextResponse.json({ error: "You don't have an active subscription to cancel." }, { status: 400 });
  }

  if (profile.cancel_at_period_end) {
    return NextResponse.json({ error: "Your subscription is already set to cancel." }, { status: 400 });
  }

  if (!profile.whop_membership_id) {
    // Real gap: we've never captured a membership id for this account
    // (e.g. it predates this feature). Fail honestly rather than pretend
    // to cancel something we can't identify.
    console.error(`billing/cancel: no whop_membership_id on file for user ${user.id}`);
    return NextResponse.json(
      { error: "We couldn't find your subscription details. Please contact support to cancel." },
      { status: 422 }
    );
  }

  const sandbox = process.env.WHOP_SANDBOX === "true";
  const baseUrl = sandbox ? "https://sandbox-api.whop.com/api/v1" : "https://api.whop.com/api/v1";

  try {
    const whopRes = await fetch(`${baseUrl}/memberships/${profile.whop_membership_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.WHOP_COMPANY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancel_at_period_end: true }),
    });

    if (!whopRes.ok) {
      const bodyText = await whopRes.text();
      console.error(`billing/cancel: Whop API returned ${whopRes.status} for user ${user.id}: ${bodyText.slice(0, 300)}`);
      return NextResponse.json(
        { error: "We couldn't process the cancellation with Whop. Please try again or contact support." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error(`billing/cancel: request to Whop threw for user ${user.id}:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Only reached after Whop confirms the cancellation was scheduled.
  // Uses the admin client for the write since this is a real billing-state
  // change that should succeed regardless of RLS nuances, same pattern as
  // the webhook.
  const admin = createAdminClient();
  await admin.from("profiles").update({ cancel_at_period_end: true }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
