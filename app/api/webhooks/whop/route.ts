import { NextResponse } from "next/server";
import { getWhop } from "@/lib/whop";
import { createAdminClient } from "@/lib/supabase/admin";
import { weeklyAllowanceFor } from "@/lib/types";
import { ourPlanFromWhopPlanId } from "@/lib/whop-plans";

// Real Whop webhook handling — verifies the signature, then updates the
// paying user's plan and resets their weekly credits.
//
// Since checkout now happens via plain Whop-hosted checkout links (not an
// API-created session), we don't have our own metadata.userId attached to
// the purchase. Instead we match the buyer back to a Creatively.ai account
// by email — Whop includes the buyer's email on every payment and
// membership webhook. This means a customer must check out with the same
// email they signed up with for their plan to update automatically.
export const runtime = "nodejs";

type WhopEvent = { type: string; id: string; data: Record<string, unknown> };
type WhopUser = { email?: string };

async function alreadyProcessed(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("webhook_events").select("id").eq("id", id).maybeSingle();
  return !!data;
}

async function markProcessed(id: string, type: string) {
  const supabase = createAdminClient();
  // Ignore errors here — a duplicate-key error just means another
  // delivery of the same event already recorded it, which is fine.
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

async function grantPlanByEmail(email: string, planId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const allowance = weeklyAllowanceFor(planId);
  const nextReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) return false;

  await supabase
    .from("profiles")
    .update({ plan: planId, ai_credits: allowance, credits_reset_at: nextReset })
    .eq("id", profile.id);

  return true;
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: WhopEvent;
  try {
    // @whop/sdk ships new versions multiple times a day right now and its
    // type declarations lag behind its own documented API — .webhooks.unwrap
    // is the officially documented method, just not fully typed yet. Cast
    // past that gap rather than fight a moving target.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event = (getWhop().webhooks as any).unwrap(bodyText, { headers }) as WhopEvent;
  } catch (err) {
    console.error("Whop webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (event.type === "payment.succeeded" || event.type === "membership.activated") {
      const email = readEmail(event.data);
      const whopPlanId = readPlanId(event.data);
      const ourPlan = whopPlanId ? ourPlanFromWhopPlanId(whopPlanId) : null;

      if (email && ourPlan) {
        const matched = await grantPlanByEmail(email, ourPlan);
        if (!matched) {
          console.error(`Whop webhook: no Creatively.ai account found for email ${email}`, event.id);
        }
      } else if (!ourPlan) {
        console.error(`Whop webhook: unrecognized plan_id ${whopPlanId}`, event.id);
      } else {
        console.error("Whop webhook: no email on payload", event.id);
      }
    } else if (event.type === "membership.deactivated") {
      const email = readEmail(event.data);
      if (email) await grantPlanByEmail(email, "Starter");
    }
    // payment.failed: nothing to do — the user's plan simply doesn't change.

    await markProcessed(event.id, event.type);
  } catch (err) {
    console.error("Whop webhook handling failed:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
