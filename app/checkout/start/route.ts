import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkoutUrlFor, type BillingInterval } from "@/lib/whop-plans";
import { redirectTo } from "@/lib/redirect";

// Pay first, create the account after — for Pro and Business.
// (The $1 Starter trial has its own route, /start-trial, which is unchanged.)
//
//   • not signed in             → straight to the plan's Whop checkout
//   • signed in, already paying → /billing (manage or change the plan there)
//   • signed in, no active plan → straight to the plan's Whop checkout
//   • checkout link not set up  → the previous flow (/signup?plan=…), so
//                                  nothing breaks while env vars are missing
//
// Nothing here grants access. Only the verified Whop webhook does, after the
// payment succeeds: it activates the account with that email, or — when no
// account exists yet — parks the grant until an account with that email is
// created and confirmed (supabase/migration-010-pay-first.sql).

export const dynamic = "force-dynamic";

const PAY_FIRST_PLANS = new Set(["Pro", "Business"]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const plan = url.searchParams.get("plan") ?? "";
  const interval: BillingInterval = url.searchParams.get("interval") === "annual" ? "annual" : "monthly";

  if (!PAY_FIRST_PLANS.has(plan)) return redirectTo("/pricing");

  const checkout = checkoutUrlFor(plan, interval);
  console.log(`checkout_start plan=${plan} interval=${interval} configured=${!!checkout}`);
  if (!checkout) return redirectTo(`/signup?plan=${plan}`);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.subscription_status === "active") return redirectTo("/billing");
  }

  return NextResponse.redirect(checkout, 303);
}
