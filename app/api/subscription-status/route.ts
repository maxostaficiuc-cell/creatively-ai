import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lightweight, authenticated-only endpoint the checkout-result page polls
// to find out whether payment has actually been confirmed yet. Reads via
// the user's own session (RLS-scoped) — never the admin client — so this
// can only ever return the caller's own status, nothing else.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, plan")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    subscriptionStatus: profile?.subscription_status ?? "unpaid",
    plan: profile?.plan ?? null,
  });
}
