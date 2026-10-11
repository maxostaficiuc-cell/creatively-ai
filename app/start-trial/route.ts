import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkoutUrlFor } from "@/lib/whop-plans";
import { STARTER_TRIAL } from "@/lib/starterTrial";

// Every "Try for $1" button points here, so there is exactly ONE trial flow:
//   • offer not configured      → normal Starter signup (no $1 anywhere)
//   • not signed in             → /signup?plan=Starter&offer=trial
//                                  (signup → onboarding → Whop trial checkout)
//   • signed in, already paying → /billing (manage the existing plan)
//   • signed in, no active plan → straight to the Whop trial checkout
//
// Nothing here grants access or credits: only the verified Whop webhook does,
// after the $1 payment succeeds.

export const dynamic = "force-dynamic";

const PLACEMENT = /^[a-z-]{1,24}$/;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const from = url.searchParams.get("from") ?? "";
  // Lightweight click tracking (no analytics tool is installed): placement only,
  // never any user or payment data.
  console.log(`starter_trial_cta_clicked placement=${PLACEMENT.test(from) ? from : "unknown"}`);

  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin), 303);

  const trialCheckout = checkoutUrlFor("Starter", "monthly", "trial");
  if (!STARTER_TRIAL.enabled || !trialCheckout) return to("/signup?plan=Starter");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return to("/signup?plan=Starter&offer=trial");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.subscription_status === "active") return to("/billing");

  return NextResponse.redirect(trialCheckout, 303);
}
