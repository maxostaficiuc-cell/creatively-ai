import { createAdminClient } from "@/lib/supabase/admin";
import { adminJson, isOwnerEmail, readJson, requireAdminApi, UUID_RE } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST { userId, status: "suspended" | "active", reason, confirm: true }
 * Changes ONLY profiles.access_status (+ audit). Billing, Whop membership, plan and
 * credits are untouched: suspension never cancels or refunds anything.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request, "admin");
  if (!auth.ok) return auth.res;
  const { admin } = auth;

  const body = await readJson(request);
  if (!body) return adminJson({ error: "Invalid request body." }, 400);
  const userId = typeof body.userId === "string" ? body.userId : "";
  const status = body.status;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!UUID_RE.test(userId)) return adminJson({ error: "Unknown user." }, 400);
  if (status !== "suspended" && status !== "active") return adminJson({ error: "Invalid status." }, 400);
  if (reason.length < 3 || reason.length > 500) return adminJson({ error: "Give a reason (3–500 characters).", fieldErrors: { reason: "Required" } }, 400);
  if (body.confirm !== true) return adminJson({ error: "Confirm the change first." }, 400);
  if (userId === admin.id) return adminJson({ error: "You can't change your own access." }, 400);

  const db = createAdminClient();
  // Protect owners and other admins: owners can never be suspended from the console,
  // and only an owner may suspend someone who holds an admin role.
  const { data: target } = await db.rpc("admin_list_users", { p_user_id: userId, p_limit: 1 });
  const t = (target as { email?: string }[] | null)?.[0];
  if (!t) return adminJson({ error: "User not found." }, 404);
  if (status === "suspended") {
    if (isOwnerEmail(t.email)) return adminJson({ error: "Owner accounts (ADMIN_EMAILS) can't be suspended here." }, 403);
    const { data: role } = await db.from("admin_users").select("role").eq("user_id", userId).is("revoked_at", null).maybeSingle();
    if (role && admin.role !== "owner") return adminJson({ error: "Only an owner can suspend another admin." }, 403);
  }

  const { data, error } = await db.rpc("admin_set_access", {
    p_admin_id: admin.id,
    p_admin_email: admin.email,
    p_user_id: userId,
    p_status: status,
    p_reason: reason,
  });
  if (error) {
    console.error(JSON.stringify({ evt: "admin_access_error", admin: admin.id, err: error.message.slice(0, 200) }));
    return adminJson({ error: "The change could not be applied. Nothing was changed." }, 500);
  }
  const r = data as { status: string; access_status?: string };
  if (r.status === "changed" || r.status === "unchanged") return adminJson({ ok: true, ...r });
  if (r.status === "rate_limited") return adminJson({ error: "Too many access changes in the last minute.", code: r.status }, 429);
  if (r.status === "no_profile") return adminJson({ error: "This account has no profile row yet.", code: r.status }, 404);
  return adminJson({ error: "Invalid change.", code: r.status }, 400);
}
