import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMetaConfigured } from "@/lib/meta/client";

// Starts the real Meta OAuth flow. Requires META_APP_ID to be set — if it
// isn't, this route is never reachable because the "Connect Meta Ads"
// button on /accounts shows a setup state instead of linking here.
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  if (!isMetaConfigured()) {
    return NextResponse.redirect(new URL("/accounts?error=meta_not_configured", request.url));
  }

  const { origin } = new URL(request.url);
  const redirectUri = `${origin}/api/meta/callback`;

  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", user.id);
  authUrl.searchParams.set("scope", "ads_read,ads_management,business_management");

  return NextResponse.redirect(authUrl.toString());
}
