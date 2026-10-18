// SERVER ONLY — Meta Ad Library API (official Graph API `ads_archive` endpoint).
// Docs: https://developers.facebook.com/docs/graph-api/reference/ads_archive/
//
// What the official API gives us, and what it doesn't:
// - It can FILTER by media type (media_type=IMAGE | MEME | VIDEO …), which is
//   how we confirm an ad is a static image ad.
// - It returns ad text (bodies, link titles/captions), page, dates, platforms
//   and an `ad_snapshot_url` (an HTML page) — but NOT the image file itself.
//   The image is therefore uploaded by an admin (saved from the ad's Ad Library
//   listing) and stored in our own Storage bucket, never hot-linked from
//   Meta's temporary CDN URLs.
// - Non-political ads are only returned when they reached the EU
//   ("Ads that did not reach any location in the EU will only return if they
//   are about social issues, elections or politics.").
// - Needs a user access token from an identity-confirmed account with Ad
//   Library API access: META_AD_LIBRARY_ACCESS_TOKEN (server-side only).

const GRAPH = process.env.META_GRAPH_API_BASE || "https://graph.facebook.com/v21.0";

const FIELDS = [
  "id",
  "page_id",
  "page_name",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_creative_link_captions",
  "ad_creative_link_descriptions",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "publisher_platforms",
  "languages",
].join(",");

export type MetaAd = {
  id: string;
  pageId: string | null;
  pageName: string | null;
  bodies: string[];
  titles: string[];
  captions: string[];
  descriptions: string[];
  start: string | null;
  stop: string | null;
  platforms: string[];
  active: boolean;
  adLibraryUrl: string;
};

/** EU countries (non-political ads are only available via the API if they reached the EU). */
export const EU_COUNTRIES = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];

export function metaAdLibraryConfigured(): boolean {
  return !!process.env.META_AD_LIBRARY_ACCESS_TOKEN;
}

type Raw = {
  id: string;
  page_id?: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
};

function toAd(r: Raw): MetaAd {
  return {
    id: String(r.id),
    pageId: r.page_id ?? null,
    pageName: r.page_name ?? null,
    bodies: r.ad_creative_bodies ?? [],
    titles: r.ad_creative_link_titles ?? [],
    captions: r.ad_creative_link_captions ?? [],
    descriptions: r.ad_creative_link_descriptions ?? [],
    start: r.ad_delivery_start_time ?? null,
    stop: r.ad_delivery_stop_time ?? null,
    platforms: (r.publisher_platforms ?? []).map((p) => p.toLowerCase()),
    active: !r.ad_delivery_stop_time,
    adLibraryUrl: `https://www.facebook.com/ads/library/?id=${encodeURIComponent(String(r.id))}`,
  };
}

export class MetaAdLibraryError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

async function archive(params: Record<string, string>): Promise<{ data: Raw[]; next: string | null }> {
  const token = process.env.META_AD_LIBRARY_ACCESS_TOKEN;
  if (!token) throw new MetaAdLibraryError("META_AD_LIBRARY_ACCESS_TOKEN is not set.", 503);
  const url = new URL(`${GRAPH}/ads_archive`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", FIELDS);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as { data?: Raw[]; paging?: { next?: string; cursors?: { after?: string } }; error?: { message?: string } };
  if (!res.ok) {
    // Never echo the token; Meta's message is safe to show to the admin.
    throw new MetaAdLibraryError(json.error?.message ? `Meta Ad Library: ${json.error.message}` : `Meta Ad Library request failed (${res.status}).`);
  }
  return { data: json.data ?? [], next: json.paging?.cursors?.after && json.paging?.next ? json.paging.cursors.after : null };
}

/** Search image ads only (media_type=IMAGE). `countries` must include at least one EU country for commercial ads. */
export async function searchImageAds(opts: { terms?: string; pageIds?: string[]; countries: string[]; activeOnly: boolean; after?: string }) {
  const params: Record<string, string> = {
    ad_type: "ALL",
    media_type: "IMAGE",
    ad_reached_countries: JSON.stringify(opts.countries),
    ad_active_status: opts.activeOnly ? "ACTIVE" : "ALL",
    limit: "25",
  };
  if (opts.terms) params.search_terms = opts.terms.slice(0, 100);
  if (opts.pageIds?.length) params.search_page_ids = JSON.stringify(opts.pageIds.slice(0, 10));
  if (opts.after) params.after = opts.after;
  const { data, next } = await archive(params);
  return { ads: data.map(toAd), after: next };
}

async function findIn(mediaType: "IMAGE" | "MEME" | "VIDEO", adId: string, pageId: string, countries: string[]): Promise<MetaAd | null> {
  let after: string | undefined;
  for (let page = 0; page < 8; page++) {
    const params: Record<string, string> = {
      ad_type: "ALL",
      media_type: mediaType,
      ad_reached_countries: JSON.stringify(countries),
      ad_active_status: "ALL",
      search_page_ids: JSON.stringify([pageId]),
      limit: "100",
    };
    if (after) params.after = after;
    const { data, next } = await archive(params);
    const hit = data.find((r) => String(r.id) === adId);
    if (hit) return toAd(hit);
    if (!next) return null;
    after = next;
  }
  return null;
}

/**
 * Confirms, via Meta's own media-type filter, that an ad is a static image ad:
 * it must appear in the IMAGE (or MEME) results for its page and must NOT
 * appear in the VIDEO results. Returns the ad's current details.
 */
export async function verifyStaticImageAd(adId: string, pageId: string, countries: string[] = EU_COUNTRIES) {
  const asImage = (await findIn("IMAGE", adId, pageId, countries)) ?? (await findIn("MEME", adId, pageId, countries));
  if (!asImage) return { ok: false as const, reason: "Meta Ad Library does not list this ad as an image ad." };
  const asVideo = await findIn("VIDEO", adId, pageId, countries);
  if (asVideo) return { ok: false as const, reason: "Meta Ad Library also lists this ad as a video ad, so it was rejected." };
  return { ok: true as const, ad: asImage };
}
