// SERVER ONLY — Winning Ads library queries (run with the signed-in user's session; RLS applies).
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIBRARY_COLUMNS, cleanSearch, type LibraryCreative, type LibrarySort } from "@/lib/library";

export type LibraryFilters = {
  q: string;
  industry: string;
  platform: string;
  format: string;
  angle: string;
  sort: LibrarySort;
  saved: boolean;
};

export type LibraryFacets = { industries: string[]; platforms: string[]; formats: string[]; angles: string[] };

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
    format: ["image", "video", "carousel"].includes(pick(sp.format)) ? pick(sp.format) : "",
    angle: pick(sp.angle).slice(0, 40),
    sort: sort === "category" || sort === "brand" ? sort : "recent",
    saved: pick(sp.saved) === "1",
  };
}

const isMissingTable = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === "42P01" || e.code === "PGRST205" || /library_creatives|library_saves/.test(e.message ?? "") && /does not exist|schema cache/.test(e.message ?? ""));

export async function loadLibrary(supabase: SupabaseClient, userId: string, f: LibraryFilters): Promise<LibraryResult> {
  // Facets come from the real, published rows — only options that exist are offered.
  const facetRes = await supabase.from("library_creatives").select("industry,platform,format,angles");
  if (facetRes.error) {
    if (isMissingTable(facetRes.error)) return { status: "not_set_up" };
    console.error(JSON.stringify({ evt: "library_facets_error", msg: facetRes.error.message }));
    return { status: "error" };
  }
  const all = (facetRes.data ?? []) as { industry: string; platform: string; format: string; angles: string[] | null }[];
  const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const facets: LibraryFacets = {
    industries: uniq(all.map((r) => r.industry)),
    platforms: uniq(all.map((r) => r.platform)),
    formats: uniq(all.map((r) => r.format)),
    angles: uniq(all.flatMap((r) => r.angles ?? [])),
  };

  const savesRes = await supabase.from("library_saves").select("creative_id").eq("user_id", userId);
  const savedIds = savesRes.error ? [] : (savesRes.data ?? []).map((r: { creative_id: string }) => r.creative_id);

  let query = supabase.from("library_creatives").select(LIBRARY_COLUMNS, { count: "exact" });
  if (f.q) {
    const like = `%${f.q}%`;
    query = query.or(
      ["brand", "title", "industry", "summary", "attribution", "messaging"].map((c) => `${c}.ilike.${like}`).join(",")
    );
  }
  if (f.industry) query = query.eq("industry", f.industry);
  if (f.platform) query = query.eq("platform", f.platform);
  if (f.format) query = query.eq("format", f.format);
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
  return { status: "ok", items: (data ?? []) as unknown as LibraryCreative[], total: count ?? (data ?? []).length, facets, savedIds };
}
