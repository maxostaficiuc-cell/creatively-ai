import { NextResponse } from "next/server";
import { runCreativeAnalysis } from "@/lib/analyzeCreative";

export const runtime = "nodejs";
export const maxDuration = 60;

// The PUBLIC, unauthenticated demo used on the marketing homepage. Calls
// the exact same AI analysis function the real dashboard uses
// (lib/analyzeCreative.ts) — no duplicate AI logic, no API key exposed to
// the browser (this all runs server-side).
//
// Because this is public and unauthenticated, it does NOT touch Supabase
// at all — nothing is stored, no credits exist to deduct. It's a stateless
// preview. It only accepts images (video is simulated-only even in the
// real product), and caps file size as a basic abuse guard.
//
// Known limitation: there's no rate limiting here yet, so this endpoint
// could be spammed to run up your Anthropic bill. Worth adding real
// rate limiting before this gets meaningful traffic.

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "The public demo supports images only right now." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large for the demo — please use a file under 8MB." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { result, isSimulated } = await runCreativeAnalysis(bytes, file.type);

  return NextResponse.json({ result, isSimulated });
}
