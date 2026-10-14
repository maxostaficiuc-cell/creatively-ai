// Creative Strategy — shared types and options. Safe for client components.

/** How we know a fact: read from a source, reasoned from what was read, a guess to confirm, or set by the user. */
export type Basis = "verified" | "inferred" | "assumption" | "confirmed";

export type ProfileField = { value: string; basis: Basis; source: string | null };

export const PROFILE_FIELDS = [
  { key: "brand_name", label: "Brand name" },
  { key: "offering", label: "What it sells" },
  { key: "value_proposition", label: "Value proposition" },
  { key: "target_audience", label: "Likely audience" },
  { key: "positioning", label: "Positioning" },
  { key: "differentiators", label: "Differentiators" },
  { key: "pricing_offers", label: "Pricing & offers" },
  { key: "pain_points", label: "Pain points addressed" },
  { key: "tone_of_voice", label: "Tone of voice" },
  { key: "visual_identity", label: "Visual identity" },
  { key: "existing_messaging", label: "Existing promotional messaging" },
] as const;
export type ProfileKey = (typeof PROFILE_FIELDS)[number]["key"];

export type SourceReport = {
  kind: "website" | "social" | "screenshots" | "notes";
  url: string | null;
  platform: string | null;
  status: "retrieved" | "partial" | "blocked" | "failed" | "provided";
  /** Plain-language explanation shown to the user. */
  note: string;
  pages: string[];
  imageCount: number;
};

export type BrandProfile = {
  fields: Record<ProfileKey, ProfileField>;
  colors: string[];
  products: { name: string; detail: string; basis: Basis }[];
  consistent_messages: string[];
  discrepancies: string[];
  missing_info: string[];
  summary: string;
  /** Public image URLs read from the website, reused as references for brand-consistent generation. */
  reference_images?: string[];
};

export type AudienceSegment = {
  name: string;
  who: string;
  problem_or_desire: string;
  motivation: string;
  message: string;
  validate: string;
};

export type Opportunity = {
  angle: string;
  audience: string;
  core_message: string;
  why_test: string;
  hypothesis: string;
};

export type Concept = {
  id: string;
  name: string;
  angle: string;
  audience: string;
  hook: string;
  message: string;
  visual: string;
  emphasis: string;
  cta: string;
  placement: string;
  why: string;
  needs_confirmation: string[];
};

export type Strategy = {
  id: string;
  parent_id: string | null;
  version: number;
  website_url: string | null;
  social_url: string | null;
  user_context: Record<string, string>;
  sources: SourceReport[];
  brand_profile: BrandProfile | null;
  audience: AudienceSegment[] | null;
  opportunities: Opportunity[] | null;
  concepts: Concept[] | null;
  status: "profiled" | "audience" | "ready" | "failed";
  brand_name: string | null;
  created_at: string;
  updated_at: string;
};

export const STRATEGY_COLUMNS =
  "id,parent_id,version,website_url,social_url,user_context,sources,brand_profile,audience,opportunities,concepts,status,brand_name,created_at,updated_at";

export const CONTEXT_FIELDS = [
  { key: "product", label: "Product or service being advertised", placeholder: "e.g. Vitamin C serum" },
  { key: "audience", label: "Target audience", placeholder: "e.g. Women 25–40 with dull skin" },
  { key: "goal", label: "Primary advertising goal", placeholder: "e.g. First purchases, leads, sign-ups" },
  { key: "market", label: "Country or market", placeholder: "e.g. United States" },
  { key: "offer", label: "Price or offer", placeholder: "e.g. $29, 15% off first order" },
  { key: "tone", label: "Brand tone", placeholder: "e.g. Clinical, friendly, playful" },
] as const;

// ── Image generation options (only what the generator supports) ─────────────
// Gemini image models generate these aspect ratios natively — no cropping.
export const ASPECT_RATIOS = [
  { id: "1:1", label: "Square 1:1", hint: "Feed" },
  { id: "4:5", label: "Portrait 4:5", hint: "Feed (recommended)" },
  { id: "9:16", label: "Vertical 9:16", hint: "Stories & Reels placements" },
] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number]["id"];

export const STYLES = [
  { id: "clean_product", label: "Clean product ad" },
  { id: "editorial", label: "Editorial" },
  { id: "ugc_static", label: "UGC-inspired static" },
  { id: "bold_promo", label: "Bold promotional" },
  { id: "brand_specific", label: "Brand-specific" },
] as const;
export type StyleId = (typeof STYLES)[number]["id"];

export const TEXT_DENSITY = [
  { id: "minimal", label: "Minimal" },
  { id: "balanced", label: "Balanced" },
  { id: "rich", label: "Information-rich" },
] as const;
export type TextDensity = (typeof TEXT_DENSITY)[number]["id"];

export const PLATFORMS = [
  { id: "meta", label: "Meta (Facebook & Instagram)" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
] as const;
export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const VARIATION_COUNTS = [1, 3, 5] as const;

export type GenerationOptions = {
  aspect_ratio: AspectRatio;
  style: StyleId;
  text_density: TextDensity;
  brand_consistency: boolean;
  platform: PlatformId;
};

export type VariationSpec = { headline: string; primary_text: string; cta: string; visual_direction: string };

export type Generation = {
  id: string;
  strategy_id: string;
  concept_id: string;
  batch_id: string;
  variation: number;
  status: "pending" | "generating" | "completed" | "failed";
  spec: VariationSpec;
  options: GenerationOptions;
  image_url: string | null;
  credits_charged: number;
  error: string | null;
  saved_creative_id: string | null;
  created_at: string;
};

export const GENERATION_COLUMNS =
  "id,strategy_id,concept_id,batch_id,variation,status,spec,options,image_path,image_mime,credits_charged,error,saved_creative_id,created_at";

/** Free brand analyses per user per rolling 24 hours (paying users only). */
export const DAILY_ANALYSIS_LIMIT = 10;
/** Copy-writing batches per user per rolling 24 hours (each batch is free; images are charged). */
export const DAILY_BATCH_LIMIT = 40;
