import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the OAuth code Meta sends back for a real access token, then
// stores the connection. This is genuine token exchange against Meta's API
// — nothing here is simulated.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !userId) {
    return NextResponse.redirect(new URL("/accounts?error=meta_connect_failed", origin));
  }

  const redirectUri = `${origin}/api/meta/callback`;

  try {
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokenData = await tokenRes.json();

    // Fetch the user's ad accounts to store a friendly name + id
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${tokenData.access_token}`
    );
    const accountsData = accountsRes.ok ? await accountsRes.json() : { data: [] };
    const firstAccount = accountsData.data?.[0];

    const supabase = createClient();
    await supabase.from("ad_accounts").upsert(
      {
        user_id: userId,
        platform: "meta",
        external_account_id: firstAccount?.id ?? null,
        account_name: firstAccount?.name ?? "Meta Ads Account",
        access_token: tokenData.access_token,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        status: "connected",
      },
      { onConflict: "user_id,platform" }
    );

    return NextResponse.redirect(new URL("/accounts?connected=meta", origin));
  } catch (err) {
    console.error("Meta OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/accounts?error=meta_connect_failed", origin));
  }
}
