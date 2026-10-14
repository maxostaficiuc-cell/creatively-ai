import { createAdminClient } from "@/lib/supabase/admin";
import { adminJson, readJson, requireAdminApi, UUID_RE } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST { userId, note } — internal note, never shown to the customer. */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request, "admin");
  if (!auth.ok) return auth.res;
  const body = await readJson(request);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!UUID_RE.test(userId)) return adminJson({ error: "Unknown user." }, 400);
  if (note.length < 1 || note.length > 2000) return adminJson({ error: "Notes must be 1–2,000 characters." }, 400);
  const { data, error } = await createAdminClient().rpc("admin_add_note", {
    p_admin_id: auth.admin.id,
    p_admin_email: auth.admin.email,
    p_user_id: userId,
    p_note: note,
  });
  if (error) return adminJson({ error: "The note could not be saved." }, 500);
  const r = data as { status: string; note_id?: string };
  if (r.status !== "added") return adminJson({ error: r.status === "no_user" ? "User not found." : "Invalid note." }, 400);
  return adminJson({ ok: true, noteId: r.note_id });
}
