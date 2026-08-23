import { NextResponse } from "next/server";
import { getWhop } from "@/lib/whop";
import { createAdminClient } from "@/lib/supabase/admin";
import { ourPlanFromWhopPlanId } from "@/lib/whop-plans";
import { weeklyAllowanceFor } from "@/lib/types";

// Real Whop webhook handling — verifies the signature, then updates the
// paying user's plan and resets their weekly credits. This is the ONLY
// place a user's plan changes as a result of an actual payment.
export const runtime = "nodejs";

type WhopEvent = { type: string; id: string; data: Record<string, unknown> };

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

function readUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>).userId;
  return typeof value === "string" ? value : null;
}

async function grantPlan(userId: string, planId: string) {
  const supabase = createAdminClient();
  const allowance = weeklyAllowanceFor(planId);
  const nextReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("profiles")
    .update({ plan: planId, ai_credits: allowance, credits_reset_at: nextReset })
    .eq("id", userId);
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: WhopEvent;
  try {
    event = getWhop().webhooks.unwrap(bodyText, { headers }) as unknown as WhopEvent;
  } catch (err) {
    console.error("Whop webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (event.type === "payment.succeeded" || event.type === "membership.activated") {
      const data = event.data as { metadata?: unknown; plan?: { id?: string } };
      const userId = readUserId(data.metadata);
      const planInfo = data.plan?.id ? ourPlanFromWhopPlanId(data.plan.id) : null;

      if (userId && planInfo) {
        await grantPlan(userId, planInfo.ourPlan);
      } else {
        console.error("Whop webhook: missing userId or unrecognized plan id", event.id);
      }
    } else if (event.type === "membership.deactivated") {
      const data = event.data as { metadata?: unknown };
      const userId = readUserId(data.metadata);
      if (userId) await grantPlan(userId, "Starter");
    }
    // payment.failed: nothing to do — the user's plan simply doesn't change.

    await markProcessed(event.id, event.type);
  } catch (err) {
    console.error("Whop webhook handling failed:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
