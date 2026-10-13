// SERVER ONLY — shared helpers for the Winning Ads admin API routes.
import { NextResponse } from "next/server";
import { getShowcaseAdmin } from "@/lib/showcaseServer";

/** Returns an error response unless the signed-in user is listed in SHOWCASE_ADMIN_EMAILS. */
export async function adminGuard() {
  const admin = await getShowcaseAdmin();
  if (admin.ok) return null;
  const status = admin.reason === "not-signed-in" ? 401 : admin.reason === "not-configured" ? 503 : 403;
  return NextResponse.json({ error: admin.reason === "forbidden" ? "Not allowed." : admin.reason }, { status });
}

export const serviceReady = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

export function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

export function httpsUrl(v: unknown): string | null {
  const s = str(v, 500);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function cleanAngles(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : String(v ?? "").split(",");
  return raw.map((a) => String(a).trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean).slice(0, 8);
}

/** Pulls a Meta Ad Library ad ID out of an ID or an Ad Library URL (…/ads/library/?id=123). */
export function parseAdLibraryId(v: unknown): string | null {
  const s = str(v, 300);
  if (!s) return null;
  if (/^\d{6,25}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (!/(^|\.)facebook\.com$/.test(u.hostname) || !u.pathname.startsWith("/ads/library")) return null;
    const id = u.searchParams.get("id");
    return id && /^\d{6,25}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
