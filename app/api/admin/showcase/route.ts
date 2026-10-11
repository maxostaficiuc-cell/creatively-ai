import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShowcaseAdmin, rowToCreative } from "@/lib/showcaseServer";
import { SHOWCASE_BUCKET, SHOWCASE_MAX_ITEMS } from "@/lib/showcase";

// Admin-only management of the homepage showcase.
// Every handler: (1) verify the signed-in user is listed in SHOWCASE_ADMIN_EMAILS,
// (2) then use the service-role client. The service-role key never leaves the server.

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_BYTES = 8 * 1024 * 1024;

async function guard() {
  const admin = await getShowcaseAdmin();
  if (admin.ok) return null;
  const status = admin.reason === "not-signed-in" ? 401 : admin.reason === "not-configured" ? 503 : 403;
  const message =
    admin.reason === "not-signed-in"
      ? "Sign in first."
      : admin.reason === "not-configured"
      ? "SHOWCASE_ADMIN_EMAILS is not set on the server."
      : "Your account is not allowed to manage the showcase.";
  return NextResponse.json({ error: message }, { status });
}

function serviceReady() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function clampScore(v: unknown, fallback = 80) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function cleanText(v: unknown, max = 60): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

/** GET — list all showcase creatives (admin view, same data as the homepage). */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("showcase_creatives")
    .select("id,image_url,width,height,score,title,category,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: (data ?? []).map(rowToCreative) });
}

/**
 * POST (multipart/form-data) — upload one creative, or replace an existing one.
 * fields: file (required), width, height (from the browser), score, title, category,
 *         replaceId (optional: swap the image of an existing row, keeping its order/score)
 */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPG or WebP image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 8 MB." }, { status: 400 });

  const width = Math.round(Number(form.get("width")));
  const height = Math.round(Number(form.get("height")));
  if (!(width > 0 && height > 0)) return NextResponse.json({ error: "Missing image dimensions." }, { status: 400 });

  const db = createAdminClient();
  const replaceId = cleanText(form.get("replaceId"), 64);

  // Enforce the 10-item limit for new uploads.
  if (!replaceId) {
    const { count } = await db.from("showcase_creatives").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= SHOWCASE_MAX_ITEMS) {
      return NextResponse.json({ error: `The showcase already has ${SHOWCASE_MAX_ITEMS} creatives. Remove or replace one first.` }, { status: 409 });
    }
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const up = await db.storage.from(SHOWCASE_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) {
    return NextResponse.json(
      { error: `Upload failed: ${up.error.message}. Does the public "${SHOWCASE_BUCKET}" bucket exist?` },
      { status: 500 }
    );
  }
  const { data: pub } = db.storage.from(SHOWCASE_BUCKET).getPublicUrl(path);

  if (replaceId) {
    const { data: old } = await db.from("showcase_creatives").select("image_path").eq("id", replaceId).maybeSingle();
    const { data, error } = await db
      .from("showcase_creatives")
      .update({ image_path: path, image_url: pub.publicUrl, width, height, updated_at: new Date().toISOString() })
      .eq("id", replaceId)
      .select("id,image_url,width,height,score,title,category,sort_order")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (old?.image_path) await db.storage.from(SHOWCASE_BUCKET).remove([old.image_path]);
    revalidatePath("/");
    return NextResponse.json({ item: rowToCreative(data) });
  }

  const { data: last } = await db
    .from("showcase_creatives")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from("showcase_creatives")
    .insert({
      image_path: path,
      image_url: pub.publicUrl,
      width,
      height,
      score: clampScore(form.get("score")),
      title: cleanText(form.get("title")),
      category: cleanText(form.get("category"), 40),
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id,image_url,width,height,score,title,category,sort_order")
    .single();
  if (error) {
    await db.storage.from(SHOWCASE_BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/");
  return NextResponse.json({ item: rowToCreative(data) }, { status: 201 });
}

/** PATCH (json) — update score/title/category, or reorder: { id, score?, title?, category? } | { order: string[] } */
export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const db = createAdminClient();

  if (Array.isArray(body.order)) {
    const ids = (body.order as unknown[]).filter((v): v is string => typeof v === "string").slice(0, SHOWCASE_MAX_ITEMS);
    for (let i = 0; i < ids.length; i++) {
      const { error } = await db.from("showcase_creatives").update({ sort_order: i }).eq("id", ids[i]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  }

  const id = cleanText(body.id, 64);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("score" in body) patch.score = clampScore(body.score);
  if ("title" in body) patch.title = cleanText(body.title);
  if ("category" in body) patch.category = cleanText(body.category, 40);
  const { data, error } = await db
    .from("showcase_creatives")
    .update(patch)
    .eq("id", id)
    .select("id,image_url,width,height,score,title,category,sort_order")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ item: rowToCreative(data) });
}

/** DELETE (json) — { id } removes the row and its image. */
export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = cleanText(body?.id, 64);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const db = createAdminClient();
  const { data: row } = await db.from("showcase_creatives").select("image_path").eq("id", id).maybeSingle();
  const { error } = await db.from("showcase_creatives").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (row?.image_path) await db.storage.from(SHOWCASE_BUCKET).remove([row.image_path]);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
