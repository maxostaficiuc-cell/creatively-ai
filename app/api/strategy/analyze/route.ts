import { NextResponse } from "next/server";
import { readSocial, readWebsite, socialPlatform, websiteDigest, type SourceImage } from "@/lib/brandSources";
import { normalizePublicUrl, SafeFetchError } from "@/lib/safeFetch";
import { buildProfile } from "@/lib/strategyAI";
import { claudeConfigured } from "@/lib/claudeJson";
import { sniffImageType, AnalysisError } from "@/lib/analyzeCreative";
import { countLast24h, jsonError, loadStrategy, log, requireActiveUser } from "@/lib/strategyServer";
import { CONTEXT_FIELDS, DAILY_ANALYSIS_LIMIT, STRATEGY_COLUMNS, type SourceReport } from "@/lib/strategyTypes";

// Step 1 of Creative Strategy: read the website / social profile (server-side,
// SSRF-safe) and build the brand profile with Claude. Free for paying users,
// limited to DAILY_ANALYSIS_LIMIT runs per 24h. Saves a new strategy version.

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_SHOTS = 4;
const MAX_SHOT_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const t0 = Date.now();
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const { db, userId } = auth;
  if (!claudeConfigured()) return jsonError(503, "Brand analysis isn't available: the AI service isn't configured on the server (ANTHROPIC_API_KEY).", { code: "ai_not_configured" });

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError(400, "Bad request.");
  const text = (k: string, max = 2000) => (typeof form.get(k) === "string" ? (form.get(k) as string).trim().slice(0, max) : "");

  // ── validate inputs ──────────────────────────────────────────────────────
  let website = text("websiteUrl", 2000);
  let social = text("socialUrl", 2000);
  const fieldErrors: Record<string, string> = {};
  const check = (v: string, key: string) => {
    if (!v) return "";
    try {
      return normalizePublicUrl(v).toString();
    } catch (e) {
      fieldErrors[key] = e instanceof SafeFetchError ? e.message : "Invalid URL.";
      return "";
    }
  };
  website = check(website, "websiteUrl");
  social = check(social, "socialUrl");
  if (Object.keys(fieldErrors).length) return jsonError(400, "Please check the links.", { fieldErrors });
  // A social link pasted into the website field is treated as the social profile.
  if (website && !social && socialPlatform(website)) [website, social] = ["", website];
  if (!website && !social) return jsonError(400, "Add your website, a social profile, or both.", { fieldErrors: { websiteUrl: "Add at least one link." } });

  const context: Record<string, string> = {};
  for (const f of CONTEXT_FIELDS) {
    const v = text(`ctx_${f.key}`, 300);
    if (v) context[f.key] = v;
  }
  const notes = text("socialNotes", 4000);

  const parentId = text("parentId", 40);
  const parent = parentId ? await loadStrategy(db, parentId, userId) : null;

  if ((await countLast24h(db, "brand_strategies", userId)) >= DAILY_ANALYSIS_LIMIT) {
    return jsonError(429, `You've run ${DAILY_ANALYSIS_LIMIT} brand analyses in the last 24 hours — the daily limit for this free feature. Your saved strategies are still available.`, { code: "daily_limit" });
  }

  // ── screenshots (optional fallback when a profile can't be read) ─────────
  const shots: SourceImage[] = [];
  for (const f of form.getAll("screenshots").slice(0, MAX_SHOTS)) {
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_SHOT_BYTES) return jsonError(400, "Each screenshot must be under 5 MB.");
    const bytes = new Uint8Array(await f.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type || type === "image/gif") return jsonError(400, "Screenshots must be PNG, JPG or WebP images.");
    shots.push({ url: "", mediaType: type, base64: Buffer.from(bytes).toString("base64"), origin: "screenshots" });
  }

  // ── read the sources (in parallel, within the time budget) ───────────────
  const fetchDeadline = t0 + 12_000;
  const [w, s] = await Promise.all([website ? readWebsite(website, fetchDeadline) : null, social ? readSocial(social, fetchDeadline) : null]);
  const reports: SourceReport[] = [];
  if (w) reports.push(w.report);
  if (s) reports.push(s.report);
  if (shots.length) reports.push({ kind: "screenshots", url: null, platform: null, status: "provided", note: `${shots.length} screenshot${shots.length === 1 ? "" : "s"} you uploaded.`, pages: [], imageCount: shots.length });
  if (notes) reports.push({ kind: "notes", url: null, platform: null, status: "provided", note: "Profile text you pasted.", pages: [], imageCount: 0 });

  const usable = (w?.extract ? 1 : 0) + (s?.text ? 1 : 0) + shots.length + (notes ? 1 : 0) + (Object.keys(context).length >= 2 ? 1 : 0);
  log("sources", { userId, website: w?.report.status, social: s?.report.status, shots: shots.length, ms: Date.now() - t0 });
  if (usable === 0) {
    // Nothing real to analyze — explain, don't invent. Nothing is saved or counted.
    return NextResponse.json(
      {
        error: "We couldn't read enough about your brand to analyze it.",
        code: "no_readable_source",
        sources: reports,
        fallback: "Paste your profile bio or a few post captions, upload screenshots, or fill in “Additional context”, then try again.",
      },
      { status: 422 }
    );
  }

  const sourcesText = [
    w?.extract ? `=== WEBSITE (${w.report.status}) ===\n${websiteDigest(w.extract)}` : website ? `=== WEBSITE ===\nCould not be read: ${w?.report.note}` : "",
    s?.text ? `=== ${s.report.platform?.toUpperCase()} PROFILE (public summary only) ===\n${s.text}` : social ? `=== SOCIAL PROFILE ===\nCould not be read: ${s?.report.note}` : "",
    notes ? `=== PROFILE TEXT PASTED BY THE USER ===\n${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const images = [...(w?.images ?? []), ...shots].slice(0, 5);
    const profile = await buildProfile({ sourcesText, userContext: context, images, deadline: t0 + 26_000 });
    profile.reference_images = (w?.images ?? []).map((i) => i.url).filter(Boolean).slice(0, 3);
    const brandName = profile.fields.brand_name.value.startsWith("Unknown") ? null : profile.fields.brand_name.value.slice(0, 80);
    const { data, error } = await db
      .from("brand_strategies")
      .insert({
        user_id: userId,
        parent_id: parent?.id ?? null,
        version: parent ? parent.version + 1 : 1,
        website_url: website || null,
        social_url: social || null,
        user_context: context,
        sources: reports,
        brand_profile: profile,
        status: "profiled",
        brand_name: brandName,
      })
      .select(STRATEGY_COLUMNS)
      .single();
    if (error) {
      log("save_error", { err: error.message });
      return jsonError(500, /brand_strategies/.test(error.message) ? "Run supabase/migration-015-creative-strategy.sql first." : "Couldn't save the analysis.");
    }
    log("profiled", { userId, id: data.id, ms: Date.now() - t0 });
    return NextResponse.json({ strategy: data });
  } catch (e) {
    const code = e instanceof AnalysisError ? e.code : "ai_failed";
    log("profile_error", { code, msg: e instanceof Error ? e.message : String(e) });
    return jsonError(code === "ai_rate_limited" ? 429 : code === "ai_timeout" ? 504 : 502, code === "ai_timeout" ? "The analysis took too long. Please try again." : "The AI couldn't finish the brand analysis. Please try again.", { code, sources: reports });
  }
}
