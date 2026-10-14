import { NextResponse } from "next/server";
import { jsonError, loadStrategy, requireActiveUser } from "@/lib/strategyServer";
import { STRATEGY_COLUMNS, type Concept } from "@/lib/strategyTypes";

// PATCH { conceptId, fields } — edit a concept's wording before generating.
export const runtime = "nodejs";

const EDITABLE: (keyof Concept)[] = ["name", "hook", "message", "visual", "emphasis", "cta", "audience", "placement"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const s = await loadStrategy(auth.db, params.id, auth.userId);
  if (!s?.concepts) return jsonError(404, "Strategy not found.");
  const body = (await req.json().catch(() => null)) as { conceptId?: string; fields?: Record<string, unknown> } | null;
  const i = s.concepts.findIndex((c) => c.id === body?.conceptId);
  if (i < 0 || !body?.fields) return jsonError(400, "Unknown concept.");
  const next = { ...s.concepts[i] } as Concept & Record<string, unknown>;
  for (const k of EDITABLE) {
    const v = body.fields[k];
    if (typeof v === "string" && v.trim()) next[k] = v.trim().slice(0, k === "visual" ? 600 : 300) as never;
  }
  const concepts = s.concepts.map((c, j) => (j === i ? { ...next, edited: true } : c));
  const { data, error } = await auth.db
    .from("brand_strategies")
    .update({ concepts, updated_at: new Date().toISOString() })
    .eq("id", s.id)
    .eq("user_id", auth.userId)
    .select(STRATEGY_COLUMNS)
    .single();
  if (error) return jsonError(500, "Couldn't save the concept.");
  return NextResponse.json({ strategy: data });
}
