// Winning Ads library — shared types, labels and helpers.
// Safe to import from client components (no secrets, no server code).
//
// The library holds STATIC IMAGE ads from real brands, sourced from Meta Ad
// Library. It is stored in public.library_creatives and is completely separate
// from a user's own analyses (public.creatives): nothing here is ever counted
// as an analysis, charged credits, or shown in a user's history or chart.

export type LibraryLabel = "verified_winner" | "strong_structure" | "inspiration";
export type MediaCheck = "meta_api_image_filter" | "admin_confirmed_in_ad_library";

export type LibraryCreative = {
  id: string;
  slug: string;
  brand: string;
  title: string;
  industry: string;
  platform: string;
  format: "image";
  angles: string[];
  summary: string;
  hook: string | null;
  visual_strategy: string | null;
  offer: string | null;
  messaging: string | null;
  cta: string | null;
  why_study: string | null;
  test_idea: string | null;
  preview_kind: "image";
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  image_path: string | null;
  headline: string | null;
  ad_copy: string | null;
  cta_text: string | null;
  source_url: string;
  source_label: string | null;
  attribution: string | null;
  ad_library_id: string | null;
  ad_library_url: string | null;
  meta_page_id: string | null;
  delivery_start: string | null;
  media_check: MediaCheck | null;
  media_checked_at: string | null;
  meta_active: boolean | null;
  meta_checked_at: string | null;
  year: number | null;
  label: LibraryLabel;
  evidence_url: string | null;
  evidence_note: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const LIBRARY_COLUMNS =
  "id,slug,brand,title,industry,platform,format,angles,summary,hook,visual_strategy,offer,messaging,cta,why_study,test_idea,preview_kind,image_url,image_width,image_height,image_path,headline,ad_copy,cta_text,source_url,source_label,attribution,ad_library_id,ad_library_url,meta_page_id,delivery_start,media_check,media_checked_at,meta_active,meta_checked_at,year,label,evidence_url,evidence_note,is_published,sort_order,created_at,updated_at";

/** Bucket the server stores library images in (public read, server-only write). */
export const LIBRARY_BUCKET = "library";

/** A row may be shown to users only when all of these hold (also enforced in the database). */
export function isDisplayableImageAd(c: Pick<LibraryCreative, "format" | "preview_kind" | "image_url" | "image_path" | "ad_library_url" | "media_check" | "is_published">): boolean {
  return (
    c.is_published &&
    c.format === "image" &&
    c.preview_kind === "image" &&
    !!c.image_url &&
    /^https:\/\//.test(c.image_url) &&
    !!c.image_path &&
    !!c.ad_library_url &&
    /^https:\/\/(www\.)?facebook\.com\/ads\/library\//.test(c.ad_library_url) &&
    !!c.media_check
  );
}

export const LABEL_TEXT: Record<LibraryLabel, string> = {
  verified_winner: "Verified Winner",
  strong_structure: "Strong Creative Structure",
  inspiration: "Creative Inspiration",
};

export const LABEL_HELP: Record<LibraryLabel, string> = {
  verified_winner: "Results for this ad were publicly reported by a named source — see the evidence link.",
  strong_structure: "Picked for a clear, reusable structure. Appearing in Meta Ad Library is not proof of performance.",
  inspiration: "Picked as creative inspiration. Appearing in Meta Ad Library is not proof of performance.",
};

export const MEDIA_CHECK_TEXT: Record<MediaCheck, string> = {
  meta_api_image_filter: "Confirmed as an image ad by Meta Ad Library's media-type filter",
  admin_confirmed_in_ad_library: "Checked as a static image ad in Meta Ad Library by the Creatively.ai team",
};

/** "Active in Ad Library" is only shown when the API confirmed it recently. */
export const ACTIVE_FRESH_DAYS = 14;
export function isRecentlyVerifiedActive(c: Pick<LibraryCreative, "meta_active" | "meta_checked_at">, now = Date.now()): boolean {
  if (!c.meta_active || !c.meta_checked_at) return false;
  return now - Date.parse(c.meta_checked_at) <= ACTIVE_FRESH_DAYS * 86_400_000;
}

export const ANGLE_TEXT: Record<string, string> = {
  "product-demo": "Product demo",
  "problem-solution": "Problem–solution",
  "founder-led": "Founder-led",
  "offer-led": "Offer-led",
  ugc: "UGC-style",
  "before-after": "Before & after",
  humor: "Humor",
  meme: "Meme",
  storytelling: "Storytelling",
  celebrity: "Celebrity",
  "brand-stance": "Brand stance",
  "social-proof": "Social proof",
  comparison: "Comparison",
  testimonial: "Testimonial",
  "product-shot": "Product shot",
};

export const angleText = (a: string) => ANGLE_TEXT[a] ?? a.replace(/-/g, " ");

export const SORTS = [
  { id: "recent", label: "Recently added" },
  { id: "category", label: "Category" },
  { id: "brand", label: "Brand A–Z" },
] as const;
export type LibrarySort = (typeof SORTS)[number]["id"];

export const adLibraryUrl = (id: string) => `https://www.facebook.com/ads/library/?id=${encodeURIComponent(id)}`;

/** Removes characters that would break a PostgREST `or=(…)` filter. */
export function cleanSearch(q: string | null | undefined): string {
  return (q ?? "").replace(/[,()*%\\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}
