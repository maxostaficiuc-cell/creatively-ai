import { createAdminClient } from "@/lib/supabase/admin";
import { adminJson, readJson, requireAdminApi, UUID_RE } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY_RE = /^[A-Za-z0-9-]{16,80}$/;
const MAX_DELTA = 1_000_000;

/**
 * POST { userId, delta, reason, idempotencyKey, confirm: true }
 * Adds (delta > 0) or removes (delta < 0) credits through admin_adjust_credits, which
 * locks the profile row, applies the change, writes credit_adjustments + the audit log
 * in one transaction, and returns the stored result for a repeated idempotencyKey.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request, "admin");
  if (!auth.ok) return auth.res;
  const { admin } = auth;

  const body = await readJson(request);
  if (!body) return adminJson({ error: "Invalid request body." }, 400);
  const userId = typeof body.userId === "string" ? body.userId : "";
  const delta = body.delta;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const key = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";

  const fieldErrors: Record<string, string> = {};
  if (!UUID_RE.test(userId)) fieldErrors.userId = "Unknown user.";
  if (typeof delta !== "number" || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_DELTA) {
    fieldErrors.delta = `Enter a whole number between 1 and ${MAX_DELTA.toLocaleString("en-US")}.`;
  }
  if (reason.length < 3 || reason.length > 500) fieldErrors.reason = "Give a reason (3–500 characters).";
  if (!KEY_RE.test(key)) fieldErrors.idempotencyKey = "Missing request key — reload the page.";
  if (body.confirm !== true) fieldErrors.confirm = "Confirm the adjustment first.";
  if (Object.keys(fieldErrors).length) return adminJson({ error: "Please fix the highlighted fields.", fieldErrors }, 400);

  const { data, error } = await createAdminClient().rpc("admin_adjust_credits", {
    p_admin_id: admin.id,
    p_admin_email: admin.email,
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason,
    p_idempotency_key: key,
  });
  if (error) {
    console.error(JSON.stringify({ evt: "admin_credits_error", admin: admin.id, err: error.message.slice(0, 200) }));
    return adminJson({ error: /admin_adjust_credits/.test(error.message) ? "Run supabase/migration-016-admin-control-center.sql first." : "The adjustment could not be applied. Nothing was changed." }, 500);
  }
  const r = data as { status: string; balance?: number; balance_before?: number; balance_after?: number; delta?: number; adjustment_id?: string; subscription_status?: string };
  switch (r.status) {
    case "applied":
    case "duplicate":
      return adminJson({ ok: true, replay: r.status === "duplicate", ...r });
    case "insufficient":
      return adminJson({ error: `Can't remove more than the current balance (${(r.balance ?? 0).toLocaleString("en-US")}).`, code: r.status }, 409);
    case "key_conflict":
      return adminJson({ error: "This request key was already used for a different adjustment. Reload and try again.", code: r.status }, 409);
    case "rate_limited":
      return adminJson({ error: "Too many adjustments in the last minute. Wait a moment.", code: r.status }, 429);
    case "no_profile":
      return adminJson({ error: "This account has no profile row, so it has no credit balance.", code: r.status }, 404);
    default:
      return adminJson({ error: "Invalid adjustment.", code: r.status }, 400);
  }
}
