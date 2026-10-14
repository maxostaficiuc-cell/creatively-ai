import { createAdminClient } from "@/lib/supabase/admin";
import { adminJson, readJson, requireAdminApi } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST { id, note? } — marks a system event resolved (audited). */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request, "admin");
  if (!auth.ok) return auth.res;
  const body = await readJson(request);
  const id = body?.id;
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : "";
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return adminJson({ error: "Invalid event." }, 400);
  const { data, error } = await createAdminClient().rpc("admin_resolve_system_event", {
    p_admin_id: auth.admin.id,
    p_admin_email: auth.admin.email,
    p_event_id: id,
    p_note: note,
  });
  if (error) return adminJson({ error: "Couldn't update the event." }, 500);
  return adminJson({ ok: true, ...(data as object) });
}
