// SERVER ONLY — never import this from a Client Component (it reads env + cookies).
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DEMO_SHOWCASE, type ShowcaseCreative } from "@/lib/showcase";

type Row = {
  id: string;
  image_url: string;
  width: number;
  height: number;
  score: number;
  title: string | null;
  category: string | null;
  sort_order: number;
};

export function rowToCreative(r: Row): ShowcaseCreative {
  return {
    id: r.id,
    imageUrl: r.image_url,
    width: r.width,
    height: r.height,
    score: r.score,
    title: r.title,
    category: r.category,
    sortOrder: r.sort_order,
  };
}

/**
 * Creatives for the public homepage. Reads with the ANON key (the table has a
 * public SELECT policy), so no secret is needed. Falls back to the demo set
 * when Supabase isn't configured, the table doesn't exist yet, or it's empty.
 */
export async function getShowcaseCreatives(): Promise<{ items: ShowcaseCreative[]; demo: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("example.supabase.co")) return { items: DEMO_SHOWCASE, demo: true };
  try {
    const supabase = createSupabaseClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("showcase_creatives")
      .select("id,image_url,width,height,score,title,category,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(10);
    if (error || !data || data.length === 0) return { items: DEMO_SHOWCASE, demo: true };
    return { items: (data as Row[]).map(rowToCreative), demo: false };
  } catch {
    return { items: DEMO_SHOWCASE, demo: true };
  }
}

/**
 * Admin check for the showcase manager. The admin is whoever is signed in with
 * an email listed in SHOWCASE_ADMIN_EMAILS (comma-separated, server-side only).
 */
export async function getShowcaseAdmin(): Promise<
  { ok: true; email: string } | { ok: false; reason: "not-signed-in" | "not-configured" | "forbidden" }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, reason: "not-signed-in" };
  const allowed = (process.env.SHOWCASE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return { ok: false, reason: "not-configured" };
  if (!allowed.includes(user.email.toLowerCase())) return { ok: false, reason: "forbidden" };
  return { ok: true, email: user.email };
}
