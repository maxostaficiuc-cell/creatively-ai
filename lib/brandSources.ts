// SERVER ONLY — reads a brand's website and/or public social profile and
// reports honestly what could and couldn't be retrieved.
import { safeFetch, SafeFetchError, normalizePublicUrl } from "@/lib/safeFetch";
import { sniffImageType } from "@/lib/analyzeCreative";
import type { SourceReport } from "@/lib/strategyTypes";

export type SourceImage = { url: string; mediaType: string; base64: string; origin: string };

export type WebsiteExtract = {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  headings: string[];
  text: string;
  prices: string[];
  jsonLd: string[];
  colors: string[];
  imageUrls: string[];
  pages: string[];
};

export type SourceBundle = {
  reports: SourceReport[];
  website: WebsiteExtract | null;
  social: { url: string; platform: string; text: string } | null;
  images: SourceImage[];
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

function meta(html: string, key: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content).trim() || null : null;
}

function visibleText(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/section|\/a)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function extract(html: string, pageUrl: string): Omit<WebsiteExtract, "pages"> {
  const abs = (h: string) => {
    try {
      return new URL(decode(h), pageUrl).toString();
    } catch {
      return null;
    }
  };
  const headings = Array.from(html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi))
    .map((m) => visibleText(m[2]))
    .filter((t) => t && t.length < 200)
    .slice(0, 25);
  const jsonLd = Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi))
    .map((m) => m[1].trim())
    .filter((t) => /Product|Offer|Organization|Brand|Service/i.test(t))
    .map((t) => t.slice(0, 2500))
    .slice(0, 4);
  const text = visibleText(html.replace(/<head[\s\S]*?<\/head>/i, " "));
  const prices = Array.from(new Set((text.match(/(?:[$€£]\s?\d[\d.,]*|\d[\d.,]*\s?(?:USD|EUR|GBP|€|lei|RON|MDL))/g) ?? []).map((p) => p.trim().replace(/[.,]+$/, "")))).slice(0, 12);
  const theme = meta(html, "theme-color");
  const hexes = (html.match(/#[0-9a-f]{6}\b/gi) ?? []).map((h) => h.toLowerCase()).filter((h) => !["#ffffff", "#000000"].includes(h));
  const freq = new Map<string, number>();
  for (const h of hexes) freq.set(h, (freq.get(h) ?? 0) + 1);
  const colors = Array.from(new Set([...(theme ? [theme.toLowerCase()] : []), ...Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([h]) => h)])).slice(0, 6);
  const og = meta(html, "og:image") ?? meta(html, "twitter:image");
  const imgs = Array.from(html.matchAll(/<img[^>]+?(?:src|data-src)=["']([^"']+)["'][^>]*>/gi))
    .filter((m) => !/logo|icon|sprite|pixel|tracking|avatar|badge|payment|flag/i.test(m[0]))
    .map((m) => abs(m[1]))
    .filter((u): u is string => !!u && /^https?:/.test(u) && !/\.svg(\?|$)/i.test(u));
  const ldImgs = jsonLd.flatMap((j) => Array.from(j.matchAll(/"image"\s*:\s*(?:\[\s*)?"([^"]+)"/g)).map((m) => abs(m[1]))).filter((u): u is string => !!u);
  return {
    url: pageUrl,
    title: visibleText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || null,
    description: meta(html, "description") ?? meta(html, "og:description"),
    siteName: meta(html, "og:site_name"),
    headings,
    text: text.slice(0, 9000),
    prices,
    jsonLd,
    colors,
    imageUrls: Array.from(new Set([...(og ? [abs(og)!] : []), ...ldImgs, ...imgs])).filter(Boolean).slice(0, 12),
  };
}

/** Same-site links that probably describe products, pricing or the brand. */
function interestingLinks(html: string, base: string): string[] {
  const host = new URL(base).hostname.replace(/^www\./, "");
  const out: string[] = [];
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try {
      u = new URL(decode(m[1]), base);
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, "") !== host || !/^https?:$/.test(u.protocol)) continue;
    const key = `${u.pathname} ${visibleText(m[2])}`.toLowerCase();
    if (/(product|shop|collection|pricing|price|plans|about|features|services|store)/.test(key) && !/(cart|login|account|checkout|policy|terms|privacy|blog\/)/.test(key)) {
      u.hash = "";
      out.push(u.toString());
    }
  }
  return Array.from(new Set(out)).slice(0, 2);
}

async function fetchImage(url: string, deadline: number): Promise<SourceImage | null> {
  try {
    const r = await safeFetch(url, { timeoutMs: 5000, maxBytes: 4_500_000, accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.5", deadline });
    const bytes = new Uint8Array(r.body);
    const type = sniffImageType(bytes);
    if (!type || type === "image/gif" || bytes.length < 3000) return null;
    return { url: r.url, mediaType: type, base64: Buffer.from(bytes).toString("base64"), origin: "website" };
  } catch {
    return null;
  }
}

export async function readWebsite(input: string, deadline: number): Promise<{ report: SourceReport; extract: WebsiteExtract | null; images: SourceImage[] }> {
  const report: SourceReport = { kind: "website", url: input, platform: null, status: "failed", note: "", pages: [], imageCount: 0 };
  try {
    const home = await safeFetch(input, { timeoutMs: 8000, deadline });
    if (!/html|xml|text\/plain/i.test(home.contentType)) {
      report.note = "The link didn't return a web page we could read.";
      return { report, extract: null, images: [] };
    }
    const html = home.body.toString("utf8");
    const main = extract(html, home.url);
    const pages = [home.url];
    // Up to two extra same-site pages (products, pricing, about), only while time allows.
    const extra = interestingLinks(html, home.url);
    const more = await Promise.all(
      extra.map(async (u) => {
        if (deadline - Date.now() < 6000) return null;
        try {
          const r = await safeFetch(u, { timeoutMs: 5000, deadline });
          return /html/i.test(r.contentType) ? extract(r.body.toString("utf8"), r.url) : null;
        } catch {
          return null;
        }
      })
    );
    for (const m of more) {
      if (!m) continue;
      pages.push(m.url);
      main.headings.push(...m.headings.slice(0, 10));
      main.text += `\n\n--- ${m.url} ---\n${m.text.slice(0, 3500)}`;
      main.prices = Array.from(new Set([...main.prices, ...m.prices])).slice(0, 16);
      main.jsonLd.push(...m.jsonLd.slice(0, 2));
      main.imageUrls = Array.from(new Set([...main.imageUrls, ...m.imageUrls])).slice(0, 14);
    }
    const thin = main.text.replace(/\s+/g, " ").length < 300;
    // Up to two real images (the share image / product shots) so the AI can see the visual identity.
    const images: SourceImage[] = [];
    for (const u of main.imageUrls) {
      if (images.length >= 2 || deadline - Date.now() < 5000) break;
      const img = await fetchImage(u, deadline);
      if (img) images.push(img);
    }
    report.status = thin ? "partial" : "retrieved";
    report.pages = pages;
    report.imageCount = images.length;
    report.note = thin
      ? "The site loaded but shows very little readable text (it may be built with JavaScript). Add details below for a better result."
      : `Read ${pages.length} page${pages.length === 1 ? "" : "s"}${images.length ? ` and ${images.length} image${images.length === 1 ? "" : "s"}` : ""}.`;
    return { report, extract: { ...main, pages }, images };
  } catch (e) {
    report.note =
      e instanceof SafeFetchError
        ? e.code === "blocked_address" || e.code === "invalid_url"
          ? e.message
          : e.code === "http_error"
          ? `${e.message} It may block automated visitors.`
          : `Couldn't read the site: ${e.message}`
        : "Couldn't read the site.";
    report.status = e instanceof SafeFetchError && (e.code === "http_error" && (e.status === 403 || e.status === 429)) ? "blocked" : "failed";
    return { report, extract: null, images: [] };
  }
}

const SOCIAL_PLATFORMS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, "Facebook"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)pinterest\.[a-z.]+$/, "Pinterest"],
];

export function socialPlatform(url: string): string | null {
  try {
    const host = normalizePublicUrl(url).hostname.toLowerCase();
    return SOCIAL_PLATFORMS.find(([re]) => re.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Public social profiles: Instagram, Facebook and TikTok normally require a
 * login for automated visitors, so usually only the public page title/description
 * (if any) can be read. We report exactly that — never more.
 */
export async function readSocial(input: string, deadline: number): Promise<{ report: SourceReport; text: string | null }> {
  const platform = socialPlatform(input) ?? "Social profile";
  const report: SourceReport = { kind: "social", url: input, platform, status: "failed", note: "", pages: [], imageCount: 0 };
  try {
    const r = await safeFetch(input, { timeoutMs: 7000, deadline });
    const html = r.body.toString("utf8");
    const loginWall = /\/accounts\/login|login_form|"loginPage"|You must log in|Log in to continue|Log into Facebook/i.test(html) || /\/login/.test(new URL(r.url).pathname);
    const title = meta(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
    const desc = meta(html, "og:description") ?? meta(html, "description");
    const bits = [title && `Title: ${decode(title)}`, desc && `Description: ${desc}`].filter(Boolean) as string[];
    const generic = !desc || /log in|sign up|create an account|see instagram photos and videos from/i.test(desc) && desc.length < 120;
    report.pages = [r.url];
    if (bits.length === 0 || (loginWall && generic)) {
      report.status = "blocked";
      report.note = `${platform} only shows this profile to signed-in visitors, so its posts and captions couldn't be read. Paste your bio or a few captions, or upload screenshots, to include it.`;
      return { report, text: null };
    }
    report.status = "partial";
    report.note = `Only the public profile summary was readable (${platform} hides posts from automated visitors). Add captions or screenshots for a fuller picture.`;
    return { report, text: bits.join("\n") };
  } catch (e) {
    report.status = e instanceof SafeFetchError && e.code === "http_error" ? "blocked" : "failed";
    report.note =
      e instanceof SafeFetchError && (e.code === "invalid_url" || e.code === "blocked_address")
        ? e.message
        : `${platform} didn't let us read this profile${e instanceof SafeFetchError && e.status ? ` (HTTP ${e.status})` : ""}. Paste your bio or captions, or upload screenshots, to include it.`;
    return { report, text: null };
  }
}

export function websiteDigest(w: WebsiteExtract): string {
  return [
    `URL: ${w.url}`,
    w.siteName && `Site name: ${w.siteName}`,
    w.title && `Page title: ${w.title}`,
    w.description && `Meta description: ${w.description}`,
    w.headings.length ? `Headings:\n- ${w.headings.join("\n- ")}` : null,
    w.prices.length ? `Prices seen on the page: ${w.prices.join(", ")}` : "No prices were found on the pages read.",
    w.colors.length ? `Colors found in the page code: ${w.colors.join(", ")}` : null,
    w.jsonLd.length ? `Structured data:\n${w.jsonLd.join("\n")}` : null,
    `Visible text (truncated):\n${w.text}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
