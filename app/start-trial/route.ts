import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkoutUrlFor } from "@/lib/whop-plans";
import { STARTER_TRIAL } from "@/lib/starterTrial";
import { sendLoopsEvent } from "@/lib/loops";
import { redirectTo } from "@/lib/redirect";

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
  const fromRaw = url.searchParams.get("from") ?? "";
  const from = PLACEMENT.test(fromRaw) ? fromRaw : "unknown";
  // Lightweight click tracking (no analytics tool is installed): placement only,
  // never any user or payment data.
  console.log(`starter_trial_cta_clicked placement=${from}`);

  // Relative redirects keep the visitor on trycreatively.space (see lib/redirect.ts).
  const to = (path: string) => redirectTo(path);

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

  // Signed-in visitor is about to see the Whop checkout. Loops events are only
  // sent if this email is already a Loops contact (never creates one).
  if (user.email) {
    // Loops-friendly source names (free_report_modal, post_analysis_offer, hero, …)
    const source =
      from === "onboarding" ? "signup" : from === "post-analysis" ? "post_analysis_offer" : from.replace(/-/g, "_");
    await Promise.all([
      from !== "onboarding" &&
        sendLoopsEvent({ email: user.email, eventName: "starter_trial_cta_clicked", eventProperties: { source } }),
      sendLoopsEvent({
        email: user.email,
        eventName: "starter_trial_checkout_started",
        eventProperties: { source },
        idempotencyKey: `stc-${user.id}-${new Date().toISOString().slice(0, 13)}`,
      }),
    ]);
  }

  return NextResponse.redirect(trialCheckout, 303);
}
