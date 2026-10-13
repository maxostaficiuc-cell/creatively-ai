// SERVER ONLY — Winning Ads library queries (run with the signed-in user's session; RLS applies).
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIBRARY_COLUMNS, cleanSearch, isDisplayableImageAd, type LibraryCreative, type LibrarySort } from "@/lib/library";

export type LibraryFilters = {
  q: string;
  industry: string;
  platform: string;
  angle: string;
  sort: LibrarySort;
  saved: boolean;
};

export type LibraryFacets = { industries: string[]; platforms: string[]; angles: string[] };

export type LibraryResult =
  | { status: "ok"; items: LibraryCreative[]; total: number; facets: LibraryFacets; savedIds: string[] }
  | { status: "not_set_up" }
  | { status: "error" };

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: Record<string, string | string[] | undefined>): LibraryFilters {
  const sort = pick(sp.sort);
  return {
    q: cleanSearch(pick(sp.q)),
    industry: pick(sp.industry).slice(0, 60),
    platform: pick(sp.platform).slice(0, 40),
    angle: pick(sp.angle).slice(0, 40),
    sort: sort === "category" || sort === "brand" ? sort : "recent",
    saved: pick(sp.saved) === "1",
  };
}

const isMissingTable = (e: { code?: string; message?: string } | null) =>
  !!e &&
  (e.code === "42P01" || e.code === "42703" || e.code === "PGRST205" || e.code === "PGRST204" ||
    (/library_creatives|library_saves|image_path|media_check|ad_library_url/.test(e.message ?? "") && /does not exist|schema cache/.test(e.message ?? "")));

export async function loadLibrary(supabase: SupabaseClient, userId: string, f: LibraryFilters): Promise<LibraryResult> {
  // Only static image ads with a stored image, a Meta Ad Library link and a
  // media-type check are ever shown (the database enforces this for published
  // rows too; this is a second, independent filter).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageOnly = <T,>(q: T): T => (q as any)
    .eq("format", "image")
    .eq("preview_kind", "image")
    .not("image_url", "is", null)
    .not("image_path", "is", null)
    .not("media_check", "is", null)
    .like("ad_library_url", "https://%facebook.com/ads/library/%");

  // Facets come from the real, displayable rows — only options that exist are offered.
  const facetRes = await imageOnly(supabase.from("library_creatives").select("industry,platform,angles"));
  if (facetRes.error) {
    if (isMissingTable(facetRes.error)) return { status: "not_set_up" };
    console.error(JSON.stringify({ evt: "library_facets_error", msg: facetRes.error.message }));
    return { status: "error" };
  }
  const all = (facetRes.data ?? []) as { industry: string; platform: string; angles: string[] | null }[];
  const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const facets: LibraryFacets = {
    industries: uniq(all.map((r) => r.industry)),
    platforms: uniq(all.map((r) => r.platform)),
    angles: uniq(all.flatMap((r) => r.angles ?? [])),
  };

  const savesRes = await supabase.from("library_saves").select("creative_id").eq("user_id", userId);
  const savedIds = savesRes.error ? [] : (savesRes.data ?? []).map((r: { creative_id: string }) => r.creative_id);

  let query = imageOnly(supabase.from("library_creatives").select(LIBRARY_COLUMNS, { count: "exact" }));
  if (f.q) {
    const like = `%${f.q}%`;
    query = query.or(
      ["brand", "title", "industry", "summary", "attribution", "messaging", "ad_copy", "headline"].map((c) => `${c}.ilike.${like}`).join(",")
    );
  }
  if (f.industry) query = query.eq("industry", f.industry);
  if (f.platform) query = query.eq("platform", f.platform);
  if (f.angle) query = query.contains("angles", [f.angle]);
  if (f.saved) query = query.in("id", savedIds.length ? savedIds : ["00000000-0000-0000-0000-000000000000"]);

  if (f.sort === "category") query = query.order("industry", { ascending: true }).order("brand", { ascending: true });
  else if (f.sort === "brand") query = query.order("brand", { ascending: true }).order("title", { ascending: true });
  else query = query.order("created_at", { ascending: false }).order("sort_order", { ascending: true });

  const { data, error, count } = await query.limit(200);
  if (error) {
    console.error(JSON.stringify({ evt: "library_query_error", msg: error.message }));
    return { status: "error" };
  }
  const items = ((data ?? []) as unknown as LibraryCreative[]).filter(isDisplayableImageAd);
  const total = items.length < (data ?? []).length ? items.length : count ?? items.length;
  return { status: "ok", items, total, facets, savedIds };
}
