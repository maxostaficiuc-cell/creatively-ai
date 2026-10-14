import { createAdminClient } from "@/lib/supabase/admin";
import { adminJson, isOwnerEmail, readJson, requireAdminApi } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST { email, role: "admin" | "viewer" | "none", reason, confirm: true } — OWNERS ONLY.
 * The person must already have a Creatively.ai account. Owners themselves are
 * defined by the ADMIN_EMAILS server env var and can't be changed here.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request, "owner");
  if (!auth.ok) return auth.res;
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return adminJson({ error: "Enter a valid email." }, 400);
  if (role !== "admin" && role !== "viewer" && role !== "none") return adminJson({ error: "Invalid role." }, 400);
  if (reason.length < 3 || reason.length > 500) return adminJson({ error: "Give a reason (3–500 characters)." }, 400);
  if (body?.confirm !== true) return adminJson({ error: "Confirm the change first." }, 400);
  if (isOwnerEmail(email)) return adminJson({ error: "Owners are set by ADMIN_EMAILS on the server, not here." }, 400);

  const { data, error } = await createAdminClient().rpc("admin_set_role", {
    p_admin_id: auth.admin.id,
    p_admin_email: auth.admin.email,
    p_target_email: email,
    p_role: role,
    p_reason: reason,
  });
  if (error) return adminJson({ error: "The change could not be applied." }, 500);
  const r = data as { status: string };
  if (r.status === "no_user") return adminJson({ error: "No Creatively.ai account uses that email. They need to sign up first." }, 404);
  if (r.status === "changed" || r.status === "unchanged") return adminJson({ ok: true, ...r });
  return adminJson({ error: "Invalid change." }, 400);
}
