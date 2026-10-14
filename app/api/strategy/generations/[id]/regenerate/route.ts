import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { jsonError, loadGeneration, requireActiveUser, withImageUrls } from "@/lib/strategyServer";
import { GENERATION_COLUMNS } from "@/lib/strategyTypes";

// Regenerate: a NEW pending image with the same copy and options (the original
// is kept). It has its own ledger request id and is charged only if delivered.
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.res;
  const g = await loadGeneration(auth.db, params.id, auth.userId);
  if (!g) return jsonError(404, "Not found.");
  const { data: last } = await auth.db.from("strategy_generations").select("variation").eq("batch_id", g.batch_id).order("variation", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await auth.db
    .from("strategy_generations")
    .insert({
      user_id: auth.userId,
      strategy_id: g.strategy_id,
      concept_id: g.concept_id,
      batch_id: g.batch_id,
      variation: (last?.variation ?? g.variation) + 1,
      request_id: `gen:${randomUUID()}`,
      status: "pending",
      spec: g.spec,
      options: g.options,
    })
    .select(GENERATION_COLUMNS)
    .single();
  if (error) return jsonError(500, "Couldn't create the new variation.");
  const [gen] = await withImageUrls(auth.db, [data as never]);
  return NextResponse.json({ generation: gen });
}
