// SERVER ONLY — shared plumbing for the Creative Strategy API routes.
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreshProfile } from "@/lib/profile";
import { GENERATION_COLUMNS, STRATEGY_COLUMNS, type Generation, type Strategy } from "@/lib/strategyTypes";
import type { Profile } from "@/lib/types";

export const GENERATED_BUCKET = "creatives"; // the existing private bucket, under each user's own folder

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Signed-in user with an active paid plan (the same rule as every other AI feature). */
export async function requireActiveUser(): Promise<{ ok: true; userId: string; profile: Profile; db: SupabaseClient } | { ok: false; res: NextResponse }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, res: jsonError(401, "Please sign in again.") };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, res: jsonError(503, "Creative Strategy isn't configured on the server yet (SUPABASE_SERVICE_ROLE_KEY).") };
  const profile = await getFreshProfile(supabase, user.id);
  if (!profile) return { ok: false, res: jsonError(401, "Please sign in again.") };
  if (profile.subscription_status !== "active") return { ok: false, res: jsonError(402, "Creative Strategy is available on an active plan.", { code: "plan_inactive" }) };
  return { ok: true, userId: user.id, profile, db: createAdminClient() };
}

export async function loadStrategy(db: SupabaseClient, id: string, userId: string): Promise<Strategy | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("brand_strategies").select(STRATEGY_COLUMNS).eq("id", id).eq("user_id", userId).maybeSingle();
  return (data as Strategy | null) ?? null;
}

type GenRow = Omit<Generation, "image_url"> & { image_path: string | null; image_mime: string | null; user_id?: string };

export async function withImageUrls(db: SupabaseClient, rows: GenRow[]): Promise<Generation[]> {
  const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await db.storage.from(GENERATED_BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
    for (const d of data ?? []) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
  }
  return rows.map(({ image_path, image_mime: _m, user_id: _u, ...r }) => ({ ...r, image_url: image_path ? urls.get(image_path) ?? null : null }));
}

export async function loadGenerations(db: SupabaseClient, strategyId: string, userId: string): Promise<Generation[]> {
  const { data } = await db
    .from("strategy_generations")
    .select(GENERATION_COLUMNS)
    .eq("strategy_id", strategyId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("variation", { ascending: true })
    .limit(120);
  return withImageUrls(db, (data ?? []) as unknown as GenRow[]);
}

export async function loadGeneration(db: SupabaseClient, id: string, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("strategy_generations").select(`${GENERATION_COLUMNS},user_id,request_id,attempts,updated_at,model`).eq("id", id).eq("user_id", userId).maybeSingle();
  return data as (GenRow & { request_id: string; attempts: number; updated_at: string; model: string | null }) | null;
}

/** Rows this user created in the last 24 hours (for the free-analysis daily limit). */
export async function countLast24h(db: SupabaseClient, table: "brand_strategies" | "strategy_generations", userId: string, distinctBatch = false) {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  if (distinctBatch) {
    const { data } = await db.from(table).select("batch_id").eq("user_id", userId).gte("created_at", since).limit(2000);
    return new Set((data ?? []).map((r: { batch_id: string }) => r.batch_id)).size;
  }
  const { count } = await db.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  return count ?? 0;
}

export const log = (evt: string, data: Record<string, unknown> = {}) => console.log(JSON.stringify({ evt: `strategy_${evt}`, ...data }));
