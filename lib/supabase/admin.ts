import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely.
// Server-only. NEVER import this from a Client Component, and never let
// SUPABASE_SERVICE_ROLE_KEY leak into anything bundled for the browser.
// This exists specifically for the Whop webhook, which has no logged-in
// user session but still needs to update the correct user's profile.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
