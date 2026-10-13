import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminGuard, cleanAngles, httpsUrl, parseAdLibraryId, serviceReady, str } from "@/lib/libraryAdmin";
import { checkStaticImage, MAX_IMAGE_BYTES } from "@/lib/imageCheck";
import { LIBRARY_BUCKET, LIBRARY_COLUMNS, adLibraryUrl } from "@/lib/library";
import { MetaAdLibraryError, metaAdLibraryConfigured, verifyStaticImageAd } from "@/lib/metaAdLibrary";

// Admin-only: add ONE static image ad to the library (multipart/form-data).
//
// Every import must pass, in order:
//  1. The uploaded file is a real static image (bytes checked: PNG/JPG/WebP,
//     not animated, not a video — the file name and MIME type are ignored).
//  2. It is tied to a Meta Ad Library ad ID.
//  3. The ad is confirmed as an image ad:
//     - mode "meta_api": Meta's own media_type=IMAGE filter lists it, and the
//       VIDEO filter does not (needs META_AD_LIBRARY_ACCESS_TOKEN), or
//     - mode "manual": the admin confirms they checked the listing in Meta Ad
//       Library and it is a single static image (recorded as such).
//  4. The image is stored in our own Storage bucket (no temporary Meta URLs).

export const runtime = "nodejs";

const TEXT: Record<string, number> = {
  brand: 80, title: 160, industry: 60, platform: 60, summary: 600, hook: 600, visual_strategy: 600, offer: 400,
  messaging: 600, cta: 300, why_study: 600, test_idea: 600, headline: 300, ad_copy: 3000, cta_text: 60, attribution: 200, evidence_note: 600,
};

const PLATFORM_TEXT: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", messenger: "Messenger", audience_network: "Audience Network", threads: "Threads" };

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!serviceReady()) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const field = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");

  // 1. static image check (bytes, not names)
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach the ad image." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image is larger than 12 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const img = checkStaticImage(bytes);
  if (!img.ok) return NextResponse.json({ error: img.reason }, { status: 422 });

  // 2. Meta Ad Library ID
  const adId = parseAdLibraryId(field("ad_library_id"));
  if (!adId) return NextResponse.json({ error: "Enter the Meta Ad Library ID or link (…/ads/library/?id=…)." }, { status: 400 });

  // 3. image-ad confirmation
  const mode = field("mode") === "meta_api" ? "meta_api" : "manual";
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {};
  for (const [k, max] of Object.entries(TEXT)) row[k] = str(field(k), max);

  if (mode === "meta_api") {
    if (!metaAdLibraryConfigured()) return NextResponse.json({ error: "META_AD_LIBRARY_ACCESS_TOKEN is not set." }, { status: 503 });
    const pageId = str(field("page_id"), 30);
    if (!pageId || !/^\d+$/.test(pageId)) return NextResponse.json({ error: "Missing the ad's Facebook page ID." }, { status: 400 });
    try {
      const v = await verifyStaticImageAd(adId, pageId);
      if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 422 });
      // Facts come from Meta, not from the form.
      row.brand = v.ad.pageName ?? row.brand;
      row.ad_copy = row.ad_copy ?? v.ad.bodies[0] ?? null;
      row.headline = row.headline ?? v.ad.titles[0] ?? null;
      row.platform = v.ad.platforms.length ? v.ad.platforms.map((p) => PLATFORM_TEXT[p] ?? p).join(" · ") : row.platform ?? "Meta";
      row.meta_page_id = pageId;
      row.meta_active = v.ad.active;
      row.meta_checked_at = now;
      row.delivery_start = v.ad.start ? v.ad.start.slice(0, 10) : null;
      row.media_check = "meta_api_image_filter";
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Meta check failed." }, { status: e instanceof MetaAdLibraryError ? e.status : 502 });
    }
  } else {
    if (field("confirm_static") !== "yes") {
      return NextResponse.json({ error: "Confirm you checked the ad in Meta Ad Library and it is a single static image (not a video, Reel or carousel)." }, { status: 400 });
    }
    row.media_check = "admin_confirmed_in_ad_library";
    row.platform = row.platform ?? "Meta";
  }
  row.media_checked_at = now;

  for (const k of ["brand", "industry", "title"]) if (!row[k]) return NextResponse.json({ error: `${k} is required.` }, { status: 400 });
  row.summary = row.summary ?? `Static image ad by ${row.brand}.`;
  row.angles = cleanAngles(field("angles"));
  const label = field("label");
  row.label = ["verified_winner", "strong_structure", "inspiration"].includes(label) ? label : "inspiration";
  row.evidence_url = httpsUrl(field("evidence_url"));
  if (row.label === "verified_winner" && (!row.evidence_url || !row.evidence_note)) {
    return NextResponse.json({ error: "Verified Winner needs an evidence link and a quoted result. Otherwise use Creative Inspiration." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: dupe } = await db.from("library_creatives").select("id").eq("ad_library_id", adId).maybeSingle();
  if (dupe) return NextResponse.json({ error: "This Meta Ad Library ad is already in the library." }, { status: 409 });

  // 4. store the image in our own bucket
  await db.storage.createBucket(LIBRARY_BUCKET, { public: true }).catch(() => null); // no-op if it exists
  const path = `${adId}-${crypto.randomUUID().slice(0, 8)}.${img.ext}`;
  const up = await db.storage.from(LIBRARY_BUCKET).upload(path, Buffer.from(bytes), { contentType: img.mime, upsert: false });
  if (up.error) return NextResponse.json({ error: `Image upload failed: ${up.error.message}` }, { status: 500 });
  const { data: pub } = db.storage.from(LIBRARY_BUCKET).getPublicUrl(path);

  const url = adLibraryUrl(adId);
  const insert = {
    ...row,
    slug: `meta-${adId}`,
    format: "image",
    preview_kind: "image",
    image_url: pub.publicUrl,
    image_path: path,
    image_width: img.width,
    image_height: img.height,
    ad_library_id: adId,
    ad_library_url: url,
    source_url: url,
    source_label: "Meta Ad Library",
    is_published: field("publish") === "yes",
  };
  const { data, error } = await db.from("library_creatives").insert(insert).select(LIBRARY_COLUMNS).single();
  if (error) {
    await db.storage.from(LIBRARY_BUCKET).remove([path]);
    return NextResponse.json({ error: error.code === "23505" ? "This ad is already in the library." : error.message }, { status: 400 });
  }
  console.log(JSON.stringify({ evt: "library_import", adId, mode, w: img.width, h: img.height }));
  revalidatePath("/winning-ads");
  return NextResponse.json({ item: data }, { status: 201 });
}
