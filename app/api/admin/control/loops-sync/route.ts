import { adminJson, requireAdminApi } from "@/lib/admin/auth";
import { syncPendingConsents } from "@/lib/marketingConsent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/** POST — retries the Loops sync for recorded marketing consents that aren't synced yet (up to 100 per click). */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request, "admin");
  if (!auth.ok) return auth.res;
  const r = await syncPendingConsents(100);
  return adminJson({ ok: !r.error || r.synced > 0, ...r }, r.error && r.synced === 0 && r.attempted === 0 ? 500 : 200);
}
