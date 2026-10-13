import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShowcaseAdmin } from "@/lib/showcaseServer";
import { LIBRARY_COLUMNS } from "@/lib/library";
import { LIBRARY_SEED } from "@/lib/librarySeed";

// Admin-only management of the Winning Ads library.
// Every handler first checks the signed-in user is listed in SHOWCASE_ADMIN_EMAILS,
// then uses the service-role client (server only; never sent to the browser).

export const runtime = "nodejs";

async function guard() {
  const admin = await getShowcaseAdmin();
  if (admin.ok) return null;
  const status = admin.reason === "not-signed-in" ? 401 : admin.reason === "not-configured" ? 503 : 403;
  return NextResponse.json({ error: admin.reason === "forbidden" ? "Not allowed." : admin.reason }, { status });
}

const serviceReady = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

const TEXT_FIELDS: Record<string, number> = {
  brand: 80, title: 160, industry: 60, platform: 40, summary: 600, hook: 600, visual_strategy: 600, offer: 400,
  messaging: 600, cta: 300, why_study: 600, test_idea: 600, headline: 120, source_label: 80, attribution: 200, evidence_note: 600,
};

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

function httpsUrl(v: unknown): string | null {
  const s = str(v, 500);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Builds a clean row from untrusted JSON. Returns an error message when something required is wrong. */
function toRow(body: Record<string, unknown>, partial: boolean): { row?: Record<string, unknown>; error?: string } {
  const row: Record<string, unknown> = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS)) if (k in body) row[k] = str(body[k], max);
  if ("slug" in body) {
    const slug = str(body.slug, 80)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return { error: "Slug is required (letters, numbers, dashes)." };
    row.slug = slug;
  }
  if ("format" in body) {
    if (!["image", "video", "carousel"].includes(String(body.format))) return { error: "Format must be image, video or carousel." };
    row.format = body.format;
  }
  if ("label" in body) {
    if (!["verified_winner", "strong_structure", "inspiration"].includes(String(body.label))) return { error: "Unknown label." };
    row.label = body.label;
  }
  if ("preview_kind" in body) {
    if (!["youtube", "image", "none"].includes(String(body.preview_kind))) return { error: "Unknown preview type." };
    row.preview_kind = body.preview_kind;
  }
  if ("youtube_id" in body) {
    const id = str(body.youtube_id, 20);
    if (id && !/^[A-Za-z0-9_-]{11}$/.test(id)) return { error: "YouTube ID must be the 11-character video ID." };
    row.youtube_id = id;
  }
  if ("angles" in body) {
    const raw = Array.isArray(body.angles) ? body.angles : String(body.angles ?? "").split(",");
    row.angles = raw.map((a) => String(a).trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean).slice(0, 8);
  }
  for (const k of ["source_url", "evidence_url", "image_url"]) {
    if (k in body) {
      const u = httpsUrl(body[k]);
      if (body[k] && !u) return { error: `${k.replace("_", " ")} must be an https:// link.` };
      row[k] = u;
    }
  }
  for (const k of ["year", "sort_order", "image_width", "image_height"]) {
    if (k in body) {
      const n = body[k] === "" || body[k] === null ? null : Math.round(Number(body[k]));
      row[k] = n !== null && Number.isFinite(n) ? n : null;
    }
  }
  if ("is_published" in body) row.is_published = Boolean(body.is_published);

  if (!partial) {
    for (const k of ["slug", "brand", "title", "industry", "platform", "format", "summary", "source_url"]) {
      if (!row[k]) return { error: `${k.replace("_", " ")} is required.` };
    }
  }
  if (row.label === "verified_winner" && (!row.evidence_url || !row.evidence_note) && !partial) {
    return { error: "Verified Winner needs an evidence link and a quoted result." };
  }
  return { row };
}

function done() {
  revalidatePath("/winning-ads");
}

/** GET — every entry, including unpublished ones. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const { data, error } = await createAdminClient()
    .from("library_creatives")
    .select(LIBRARY_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [], seedCount: LIBRARY_SEED.length });
}

/** POST — create an entry, or { action: "restore-seed" } to re-add any missing curated examples. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const db = createAdminClient();

  if (body.action === "restore-seed") {
    // Idempotent: existing slugs are left untouched (admin edits are never overwritten).
    const { data, error } = await db
      .from("library_creatives")
      .upsert(LIBRARY_SEED, { onConflict: "slug", ignoreDuplicates: true })
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    done();
    return NextResponse.json({ added: data?.length ?? 0 });
  }

  const { row, error: bad } = toRow(body, false);
  if (bad || !row) return NextResponse.json({ error: bad }, { status: 400 });
  const { data, error } = await db.from("library_creatives").insert(row).select(LIBRARY_COLUMNS).single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That slug is already used." : error.message }, { status: 400 });
  done();
  return NextResponse.json({ item: data }, { status: 201 });
}

/** PATCH — { id, ...fields } updates an entry (edit, recategorize, publish/unpublish). */
export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = str(body?.id, 64);
  if (!body || !id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { row, error: bad } = toRow(body, true);
  if (bad || !row) return NextResponse.json({ error: bad }, { status: 400 });
  delete row.id;
  row.updated_at = new Date().toISOString();
  const { data, error } = await createAdminClient().from("library_creatives").update(row).eq("id", id).select(LIBRARY_COLUMNS).single();
  if (error) {
    const msg = /verified_needs_evidence/.test(error.message) ? "Verified Winner needs an evidence link and a quoted result." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  done();
  return NextResponse.json({ item: data });
}

/** DELETE — { id } removes an entry (and anyone's saves of it). */
export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = str(body?.id, 64);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { error } = await createAdminClient().from("library_creatives").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  done();
  return NextResponse.json({ ok: true });
}
