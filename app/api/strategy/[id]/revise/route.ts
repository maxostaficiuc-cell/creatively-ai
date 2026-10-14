import { NextResponse } from "next/server";
import { countLast24h, jsonError, loadStrategy, log, requireActiveUser } from "@/lib/strategyServer";
import { DAILY_ANALYSIS_LIMIT, PROFILE_FIELDS, STRATEGY_COLUMNS, type BrandProfile, type ProfileKey } from "@/lib/strategyTypes";

// "Edit brand details": saves the user's corrections as a NEW version (the
// previous version and its concepts/creatives stay untouched). The client then
// re-runs the audience and concepts steps for the new version.
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const prev = await loadStrategy(auth.db, params.id, auth.userId);
  if (!prev?.brand_profile) return jsonError(404, "Strategy not found.");
  const body = (await req.json().catch(() => null)) as { fields?: Record<string, unknown>; colors?: unknown } | null;
  if (!body?.fields || typeof body.fields !== "object") return jsonError(400, "Nothing to update.");

  const profile: BrandProfile = JSON.parse(JSON.stringify(prev.brand_profile));
  let changed = 0;
  for (const f of PROFILE_FIELDS) {
    const v = body.fields[f.key];
    if (typeof v !== "string") continue;
    const t = v.trim().slice(0, 600);
    if (!t || t === profile.fields[f.key as ProfileKey].value) continue;
    profile.fields[f.key as ProfileKey] = { value: t, basis: "confirmed", source: "you" };
    changed++;
  }
  if (Array.isArray(body.colors)) {
    const colors = body.colors.map(String).filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 5);
    if (colors.join() !== profile.colors.join()) {
      profile.colors = colors;
      changed++;
    }
  }
  if (!changed) return jsonError(400, "No changes to save.");
  if ((await countLast24h(auth.db, "brand_strategies", auth.userId)) >= DAILY_ANALYSIS_LIMIT) {
    return jsonError(429, `Daily limit of ${DAILY_ANALYSIS_LIMIT} brand analyses reached. Try again tomorrow.`, { code: "daily_limit" });
  }
  const brandName = profile.fields.brand_name.value.startsWith("Unknown") ? null : profile.fields.brand_name.value.slice(0, 80);
  const { data, error } = await auth.db
    .from("brand_strategies")
    .insert({
      user_id: auth.userId,
      parent_id: prev.id,
      version: prev.version + 1,
      website_url: prev.website_url,
      social_url: prev.social_url,
      user_context: prev.user_context,
      sources: prev.sources,
      brand_profile: profile,
      status: "profiled",
      brand_name: brandName,
    })
    .select(STRATEGY_COLUMNS)
    .single();
  if (error) return jsonError(500, "Couldn't save your changes.");
  log("revised", { from: prev.id, to: data.id, changed });
  return NextResponse.json({ strategy: data });
}
