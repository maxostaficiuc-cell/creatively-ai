// SERVER ONLY — Admin Control Center authorization. Never import from a Client Component.
//
// Who is an admin (checked on EVERY page render and EVERY API request):
//   1. A valid Supabase session, verified with Supabase Auth (getUser), and
//   2. a CONFIRMED email address, and
//   3. either the email is in ADMIN_EMAILS (server env var → role "owner"),
//      or the user id has an active row in public.admin_users (role "admin" or
//      "viewer"), which only an owner can grant from the console, and
//   4. the account itself is not suspended.
// Nothing a customer can edit (profile fields, user metadata, the signup form)
// is consulted, and the admin_users table is unreadable/unwritable from browsers.
import { NextResponse } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "owner" | "admin" | "viewer";
export type Admin = { id: string; email: string; role: AdminRole };
export type AdminCheck =
  | { ok: true; admin: Admin }
  | { ok: false; reason: "not-signed-in" | "forbidden" | "not-configured" };

const RANK: Record<AdminRole, number> = { viewer: 1, admin: 2, owner: 3 };

export function ownerEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && ownerEmails().includes(email.trim().toLowerCase());
}

export function adminServiceReady(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export async function getAdmin(): Promise<AdminCheck> {
  if (!adminServiceReady()) return { ok: false, reason: "not-configured" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not-signed-in" };
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.email_confirmed_at) return { ok: false, reason: "forbidden" };

  const db = createAdminClient();
  let role: AdminRole | null = isOwnerEmail(email) ? "owner" : null;
  if (!role) {
    const { data } = await db.from("admin_users").select("role").eq("user_id", user.id).is("revoked_at", null).maybeSingle();
    const r = (data as { role?: string } | null)?.role;
    role = r === "admin" || r === "viewer" ? r : null;
  }
  if (!role) return { ok: false, reason: "forbidden" };

  const { data: prof } = await db.from("profiles").select("access_status").eq("id", user.id).maybeSingle();
  if ((prof as { access_status?: string } | null)?.access_status === "suspended") return { ok: false, reason: "forbidden" };

  return { ok: true, admin: { id: user.id, email, role } };
}

export function hasRole(admin: Admin, min: AdminRole): boolean {
  return RANK[admin.role] >= RANK[min];
}

/**
 * For console pages. Signed-out visitors go to sign-in; everyone else who isn't an
 * admin gets a plain 404, so the console's existence isn't advertised.
 */
export async function requireAdminPage(min: AdminRole = "viewer", next = "/admin"): Promise<Admin> {
  const check = await getAdmin();
  if (!check.ok) {
    if (check.reason === "not-signed-in") redirect(`/login?next=${encodeURIComponent(next)}`);
    notFound();
  }
  if (!hasRole(check.admin, min)) notFound();
  return check.admin;
}

const noStore = { "cache-control": "no-store", "x-robots-tag": "noindex" };
export function adminJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

/**
 * For console API routes. Rejects (401/403) anything that isn't an authorised admin
 * with at least `min` role. For state-changing methods it also requires a same-origin
 * JSON request (CSRF protection: a cross-site form or fetch can't satisfy both).
 */
export async function requireAdminApi(
  request: Request,
  min: AdminRole
): Promise<{ ok: true; admin: Admin } | { ok: false; res: NextResponse }> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (!isSameOrigin(request)) return { ok: false, res: adminJson({ error: "Cross-site request rejected." }, 403) };
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
      return { ok: false, res: adminJson({ error: "Expected a JSON request." }, 415) };
    }
  }
  const check = await getAdmin();
  if (!check.ok) {
    if (check.reason === "not-signed-in") return { ok: false, res: adminJson({ error: "Not signed in." }, 401) };
    if (check.reason === "not-configured") return { ok: false, res: adminJson({ error: "Admin console is not configured." }, 503) };
    return { ok: false, res: adminJson({ error: "Forbidden." }, 403) };
  }
  if (!hasRole(check.admin, min)) return { ok: false, res: adminJson({ error: "Your admin role can't do this." }, 403) };
  return { ok: true, admin: check.admin };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
  try {
    return !!host && new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

/** Parses a JSON body with a size cap. Returns null for anything malformed. */
export async function readJson(request: Request, maxBytes = 8_000): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
