import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Save / unsave a Winning Ads library item for the signed-in user.
// Runs with the user's own session (RLS: users can only write their own saves).
// Touches only public.library_saves — never credits or analysis history.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { creativeId?: unknown; saved?: unknown } | null;
  const creativeId = typeof body?.creativeId === "string" ? body.creativeId : "";
  if (!UUID.test(creativeId) || typeof body?.saved !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.saved) {
    // Idempotent: saving twice leaves one row.
    const { error } = await supabase
      .from("library_saves")
      .upsert({ user_id: user.id, creative_id: creativeId }, { onConflict: "user_id,creative_id", ignoreDuplicates: true });
    if (error) {
      console.error(JSON.stringify({ evt: "library_save_error", msg: error.message }));
      return NextResponse.json({ error: "Couldn't save." }, { status: error.code === "23503" ? 404 : 500 });
    }
  } else {
    const { error } = await supabase.from("library_saves").delete().eq("user_id", user.id).eq("creative_id", creativeId);
    if (error) {
      console.error(JSON.stringify({ evt: "library_unsave_error", msg: error.message }));
      return NextResponse.json({ error: "Couldn't remove." }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, saved: body.saved });
}
