// Winning Ads library — shared types, labels and helpers.
// Safe to import from client components (no secrets, no server code).
//
// The library is curated inspiration. It is stored in public.library_creatives
// and is completely separate from a user's own analyses (public.creatives):
// nothing here is ever counted as an analysis, charged credits, or shown in a
// user's history or score chart.

export type LibraryLabel = "verified_winner" | "strong_structure" | "inspiration";
export type LibraryFormat = "image" | "video" | "carousel";
export type PreviewKind = "youtube" | "image" | "none";

export type LibraryCreative = {
  id: string;
  slug: string;
  brand: string;
  title: string;
  industry: string;
  platform: string;
  format: LibraryFormat;
  angles: string[];
  summary: string;
  hook: string | null;
  visual_strategy: string | null;
  offer: string | null;
  messaging: string | null;
  cta: string | null;
  why_study: string | null;
  test_idea: string | null;
  preview_kind: PreviewKind;
  youtube_id: string | null;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  headline: string | null;
  source_url: string;
  source_label: string | null;
  attribution: string | null;
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
  "id,slug,brand,title,industry,platform,format,angles,summary,hook,visual_strategy,offer,messaging,cta,why_study,test_idea,preview_kind,youtube_id,image_url,image_width,image_height,headline,source_url,source_label,attribution,year,label,evidence_url,evidence_note,is_published,sort_order,created_at,updated_at";

export const LABEL_TEXT: Record<LibraryLabel, string> = {
  verified_winner: "Verified Winner",
  strong_structure: "Strong Creative Structure",
  inspiration: "Creative Inspiration",
};

export const LABEL_HELP: Record<LibraryLabel, string> = {
  verified_winner: "Results for this ad were publicly reported by a named source — see the evidence link.",
  strong_structure: "Picked for a clear, reusable structure. No performance claim is made.",
  inspiration: "Picked as creative inspiration. No performance claim is made.",
};

export const FORMAT_TEXT: Record<LibraryFormat, string> = { image: "Static", video: "Video", carousel: "Carousel" };

export const ANGLE_TEXT: Record<string, string> = {
  "product-demo": "Product demo",
  "problem-solution": "Problem–solution",
  "founder-led": "Founder-led",
  "offer-led": "Offer-led",
  ugc: "UGC-style",
  "before-after": "Before & after",
  humor: "Humor",
  storytelling: "Storytelling",
  celebrity: "Celebrity",
  "brand-stance": "Brand stance",
  "social-proof": "Social proof",
  comparison: "Comparison",
};

export const angleText = (a: string) => ANGLE_TEXT[a] ?? a.replace(/-/g, " ");

export const SORTS = [
  { id: "recent", label: "Recently added" },
  { id: "category", label: "Category" },
  { id: "brand", label: "Brand A–Z" },
] as const;
export type LibrarySort = (typeof SORTS)[number]["id"];

/** YouTube's own thumbnail for a video — the permitted preview for an embeddable YouTube upload. */
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
/** Privacy-enhanced embed; only loaded when the viewer presses play. */
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Removes characters that would break a PostgREST `or=(…)` filter. */
export function cleanSearch(q: string | null | undefined): string {
  return (q ?? "").replace(/[,()*%\\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}
