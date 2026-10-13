import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIntegrations } from "@/lib/integrations";

// Starts the real Meta OAuth flow — only when the Meta integration is
// configured AND switched live (see lib/integrations.ts). Otherwise the user
// goes back to Ad Performance, which explains it's coming soon; nobody is
// sent into an unfinished OAuth flow by typing this URL.
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  if (getIntegrations().find((i) => i.id === "meta")?.status !== "available") {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  const { origin } = new URL(request.url);
  const redirectUri = `${origin}/api/meta/callback`;

  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", user.id);
  authUrl.searchParams.set("scope", "ads_read");

  return NextResponse.redirect(authUrl.toString());
}
