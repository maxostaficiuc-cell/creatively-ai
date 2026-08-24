import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";
import { runCreativeAnalysis } from "@/lib/analyzeCreative";

export const runtime = "nodejs";
export const maxDuration = 60;

// The authenticated, credits-deducting, storage-persisting analyze
// endpoint used inside the real dashboard. The actual AI call lives in
// lib/analyzeCreative.ts and is shared with the public marketing-site demo
// (app/api/demo-analyze/route.ts) — there's only one analysis
// implementation, this route just adds the account/credits/storage layer
// around it.

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const platform = (formData.get("platform") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const fileType: "image" | "video" = isVideo ? "video" : "image";
  const cost = isVideo ? CREDIT_COST_VIDEO : CREDIT_COST_IMAGE;

  // Single source of truth for credits — this also applies the weekly
  // reset if the user's period has rolled over.
  const profile = await getFreshProfile(supabase, user.id);
  const currentCredits = profile?.ai_credits ?? 0;

  if (currentCredits < cost) {
    return NextResponse.json(
      {
        error: `Not enough AI credits. This analysis costs ${cost}, you have ${currentCredits} remaining this week.`,
      },
      { status: 402 }
    );
  }

  // Upload to Supabase Storage under the user's own folder
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("creatives")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}. Make sure a private storage bucket named "creatives" exists.` },
      { status: 500 }
    );
  }

  const { data: signedUrlData } = await supabase.storage
    .from("creatives")
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

  const fileUrl = signedUrlData?.signedUrl ?? path;

  let finalResult;
  let isSimulated: boolean;

  if (isVideo) {
    // Video analysis isn't built yet — clearly labeled simulated result.
    finalResult = {
      score: 30 + Math.floor(Math.random() * 60),
      summary: "Video analysis is simulated for now — real video AI analysis is a larger feature.",
      whats_working: "This is a placeholder result because video isn't analyzed yet.",
      whats_not: "No real creative analysis has been performed on this video.",
      what_to_test: "Upload an image instead for a real AI-powered analysis.",
    };
    isSimulated = true;
  } else {
    const { result, isSimulated: aiSimulated } = await runCreativeAnalysis(bytes, file.type);
    finalResult = result;
    isSimulated = aiSimulated;
  }

  // Deduct credits and record the analysis
  await supabase
    .from("profiles")
    .update({ ai_credits: currentCredits - cost })
    .eq("id", user.id);

  const { data: creative, error: insertError } = await supabase
    .from("creatives")
    .insert({
      user_id: user.id,
      file_url: fileUrl,
      file_type: fileType,
      platform,
      score: finalResult.score,
      summary: finalResult.summary,
      whats_working: finalResult.whats_working,
      whats_not: finalResult.whats_not,
      what_to_test: finalResult.what_to_test,
      credits_used: cost,
      is_simulated: isSimulated,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ creative, remainingCredits: currentCredits - cost });
}
