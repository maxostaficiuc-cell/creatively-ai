import { NextResponse } from "next/server";
import { jsonError, loadGeneration, requireActiveUser, withImageUrls } from "@/lib/strategyServer";
import { GENERATION_COLUMNS } from "@/lib/strategyTypes";

// PATCH { headline?, primary_text?, cta? } — edit a variation's copy. Before the
// image is generated this also changes the text rendered on it; afterwards it
// only changes the copy (use Regenerate for a new image).
export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const g = await loadGeneration(auth.db, params.id, auth.userId);
  if (!g) return jsonError(404, "Not found.");
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const spec = { ...g.spec };
  for (const [k, max] of [["headline", 120], ["primary_text", 600], ["cta", 40]] as const) {
    const v = body?.[k];
    if (typeof v === "string" && v.trim()) spec[k] = v.trim().slice(0, max);
  }
  const { data, error } = await auth.db.from("strategy_generations").update({ spec, updated_at: new Date().toISOString() }).eq("id", g.id).select(GENERATION_COLUMNS).single();
  if (error) return jsonError(500, "Couldn't save the copy.");
  const [gen] = await withImageUrls(auth.db, [data as never]);
  return NextResponse.json({ generation: gen });
}
