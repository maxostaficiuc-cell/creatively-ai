import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GENERATED_BUCKET, jsonError, loadGeneration } from "@/lib/strategyServer";

// Download a generated image (owner only) as a file.
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "Please sign in again.");
  const db = createAdminClient();
  const g = await loadGeneration(db, params.id, user.id);
  if (!g?.image_path) return jsonError(404, "Not found.");
  const { data, error } = await db.storage.from(GENERATED_BUCKET).download(g.image_path);
  if (error || !data) return jsonError(404, "Image not found.");
  const ext = g.image_path.split(".").pop() ?? "png";
  const name = `creatively-${(g.spec.headline || "ad").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${g.variation}.${ext}`;
  return new Response(data, {
    headers: {
      "content-type": g.image_mime ?? "image/png",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "private, no-store",
    },
  });
}
