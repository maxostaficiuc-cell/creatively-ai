import { createClient } from "@/lib/supabase/server";
import { redirectTo, safePath } from "@/lib/redirect";
import { syncSignupConsent } from "@/lib/marketingConsent";

// Handles the redirect from Supabase email links (signup confirmation
// and password reset) and exchanges the code for a session.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Same-site paths only (keeps ?plan=…&offer=trial intact).
  const next = safePath(searchParams.get("next"), "/onboarding");

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    // The email is now confirmed: if they ticked the sign-up opt-in, record it
    // and add them to Loops. Never blocks or breaks the redirect.
    await syncSignupConsent(data?.user ?? null).catch(() => null);
  }

  // Relative redirect: on Netlify the request origin is the internal deploy
  // address, which would move the visitor off trycreatively.space and lose
  // the session that was just created.
  return redirectTo(next, 307);
}
