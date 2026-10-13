import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminGuard, cleanAngles, httpsUrl, serviceReady, str } from "@/lib/libraryAdmin";
import { LIBRARY_BUCKET, LIBRARY_COLUMNS } from "@/lib/library";
import { metaAdLibraryConfigured, verifyStaticImageAd, MetaAdLibraryError } from "@/lib/metaAdLibrary";

// Admin-only management of the Winning Ads library (static image ads only).
// New entries are added through /api/admin/library/import (image upload +
// Meta Ad Library check). This route lists, edits text/categories,
// publishes/hides, re-checks and deletes.
// Every handler checks SHOWCASE_ADMIN_EMAILS first, then uses the service-role
// client (server only; never sent to the browser).

export const runtime = "nodejs";

// Only descriptive fields can be edited here. The image, its Meta Ad Library
// link and the media-type check are fixed at import and can't be changed.
const TEXT_FIELDS: Record<string, number> = {
  brand: 80, title: 160, industry: 60, platform: 60, summary: 600, hook: 600, visual_strategy: 600, offer: 400,
  messaging: 600, cta: 300, why_study: 600, test_idea: 600, headline: 300, ad_copy: 3000, cta_text: 60, attribution: 200, evidence_note: 600,
};

function done() {
  revalidatePath("/winning-ads");
}

/** GET — every entry (including hidden ones) + whether the Meta API token is configured. */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const { data, error } = await createAdminClient()
    .from("library_creatives")
    .select(LIBRARY_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: /image_path|media_check|ad_library/.test(error.message) ? "Run supabase/migration-014-library-image-ads-only.sql first." : error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [], metaConfigured: metaAdLibraryConfigured() });
}

/** POST { action: "recheck", id } — re-confirms an API-imported ad with Meta (image-only + active status). */
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { action?: unknown; id?: unknown } | null;
  if (body?.action !== "recheck") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const id = str(body.id, 64);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const db = createAdminClient();
  const { data: row } = await db.from("library_creatives").select("ad_library_id, meta_page_id").eq("id", id).maybeSingle();
  if (!row?.ad_library_id || !row.meta_page_id) return NextResponse.json({ error: "Only ads imported through the Meta API can be re-checked." }, { status: 400 });
  try {
    const v = await verifyStaticImageAd(row.ad_library_id, row.meta_page_id);
    const now = new Date().toISOString();
    const patch = v.ok
      ? { meta_active: v.ad.active, meta_checked_at: now, media_checked_at: now, updated_at: now }
      : { is_published: false, meta_active: null, meta_checked_at: now, updated_at: now }; // no longer confirmed → hidden
    const { data, error } = await db.from("library_creatives").update(patch).eq("id", id).select(LIBRARY_COLUMNS).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    done();
    return NextResponse.json({ item: data, confirmed: v.ok, reason: v.ok ? null : v.reason });
  } catch (e) {
    const status = e instanceof MetaAdLibraryError ? e.status : 502;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Meta check failed." }, { status });
  }
}

/** PATCH — { id, ...fields } edits text/category/label or publishes/hides an entry. */
export async function PATCH(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = str(body?.id, 64);
  if (!body || !id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const row: Record<string, unknown> = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS)) if (k in body) row[k] = str(body[k], max);
  for (const k of ["brand", "title", "industry", "platform", "summary"]) if (k in row && !row[k]) return NextResponse.json({ error: `${k} can't be empty.` }, { status: 400 });
  if ("angles" in body) row.angles = cleanAngles(body.angles);
  if ("label" in body) {
    if (!["verified_winner", "strong_structure", "inspiration"].includes(String(body.label))) return NextResponse.json({ error: "Unknown label." }, { status: 400 });
    row.label = body.label;
  }
  if ("evidence_url" in body) {
    const u = httpsUrl(body.evidence_url);
    if (body.evidence_url && !u) return NextResponse.json({ error: "Evidence link must be https://." }, { status: 400 });
    row.evidence_url = u;
  }
  if ("sort_order" in body) row.sort_order = Math.round(Number(body.sort_order)) || 0;
  if ("is_published" in body) row.is_published = Boolean(body.is_published);
  row.updated_at = new Date().toISOString();

  const { data, error } = await createAdminClient().from("library_creatives").update(row).eq("id", id).select(LIBRARY_COLUMNS).single();
  if (error) {
    const msg = /verified_needs_evidence/.test(error.message)
      ? "Verified Winner needs an evidence link and a quoted result."
      : /publish_requirements/.test(error.message)
      ? "This entry can't be published: it needs a stored image, a Meta Ad Library link and a media-type check."
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  done();
  return NextResponse.json({ item: data });
}

/** DELETE — { id } removes an entry, its stored image, and anyone's saves of it. */
export async function DELETE(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = str(body?.id, 64);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const db = createAdminClient();
  const { data: row } = await db.from("library_creatives").select("image_path").eq("id", id).maybeSingle();
  const { error } = await db.from("library_creatives").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (row?.image_path) await db.storage.from(LIBRARY_BUCKET).remove([row.image_path]);
  done();
  return NextResponse.json({ ok: true });
}
