import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSignupConsent } from "@/lib/marketingConsent";

// Backup for the sign-up opt-in when the confirmation link was opened in a
// different browser (so /auth/callback couldn't sign them in). Called once per
// session by the signed-in app. Only ever acts on the caller's OWN confirmed
// account and their own opt-in; returns no personal data.
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await syncSignupConsent(user).catch(() => null);
  return NextResponse.json({ ok: true, optedIn: !!r });
}
