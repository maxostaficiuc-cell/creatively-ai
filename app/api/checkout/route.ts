import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWhop, isWhopConfigured } from "@/lib/whop";
import { whopPlanIdFor, type BillingInterval } from "@/lib/whop-plans";

// Creates a real Whop checkout session tagged with the user's ID, then
// redirects to the embedded checkout page. When the payment succeeds,
// Whop's webhook (app/api/webhooks/whop/route.ts) reads that same ID back
// and updates the user's plan — that round trip is how we know who paid.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { origin } = new URL(request.url);

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (!isWhopConfigured()) {
    return NextResponse.redirect(new URL("/billing?error=whop_not_configured", origin));
  }

  const formData = await request.formData();
  const plan = formData.get("plan") as string;
  const interval = ((formData.get("interval") as string) || "monthly") as BillingInterval;

  const whopPlanId = whopPlanIdFor(plan, interval);
  if (!whopPlanId) {
    return NextResponse.redirect(new URL("/billing?error=plan_not_configured", origin));
  }

  try {
    const config = await getWhop().checkoutConfigurations.create({
      plan_id: whopPlanId,
      redirect_url: `${origin}/checkout/complete`,
      metadata: { userId: user.id, ourPlan: plan, interval },
    });

    const url = new URL("/checkout", origin);
    url.searchParams.set("session", (config as { id: string }).id);
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("Whop checkout creation failed:", err);
    return NextResponse.redirect(new URL("/billing?error=checkout_failed", origin));
  }
}
