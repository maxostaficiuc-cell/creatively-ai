import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Uses Claude's vision capability to give a real, rigorous, ROAS-focused
// critique of an uploaded ad image. Requires ANTHROPIC_API_KEY to be set.
// Video files are accepted and stored, but scored with a clearly-labeled
// simulated result for now — real video analysis is a larger feature.

const ANALYSIS_PROMPT = `You are a senior performance-marketing creative strategist reviewing a single advertising creative (used as a paid ad on Meta, TikTok, or Google). You have reviewed thousands of ads and know most ads are mediocre.

Be BRUTALLY HONEST. Most ads should score in the 40-75 range. Reserve 85+ for genuinely exceptional creative — a strong hook, clear offer, sharp visual execution, and real conversion potential all present at once. That combination is rare. A merely polished-looking ad with weak messaging or no clear offer should score 50-65, not 80+. A generic, unfocused, or poorly targeted ad can and should score below 40.

Evaluate across these dimensions, using what you actually see in the image (specific colors, copy, layout, offer, CTA, product framing) — never generic praise:

1. HOOK — Does it grab attention immediately? Is the headline compelling and clear within seconds?
2. OFFER — Is there a clear, specific value proposition? A reason to act now?
3. CREATIVE QUALITY — Visual hierarchy, composition, readability, branding, contrast.
4. CONVERSION POTENTIAL — CTA clarity, trust signals, social proof, objection handling, urgency.
5. AUDIENCE FIT — Does it speak to a specific audience, or feel generic?
6. DIFFERENTIATION — Does it look like every other ad in this category, or does it have a distinct angle?

In your written feedback, prioritize actionable criticism over compliments. Instead of "Great visual design," say something like "Strong product photography, but the headline communicates almost no customer benefit — a viewer can see what the product is without understanding why they should buy it." Instead of "Good CTA," say "The CTA is visible, but 'Learn More' creates weak purchase intent — test a benefit-driven CTA tied to the specific offer."

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "score": <integer 0-100, following the strict, discriminating scale above>,
  "summary": "<one honest sentence verdict — name the single biggest issue or strength>",
  "whats_working": "<2-3 sentences on genuine, specific strengths — skip this if there are none worth naming>",
  "whats_not": "<2-3 sentences identifying the biggest conversion problem first, then messaging or visual issues, with specifics>",
  "what_to_test": "<2-3 sentences with specific, actionable next tests to improve ROAS>"
}`;

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

  let result: {
    score: number;
    summary: string;
    whats_working: string;
    whats_not: string;
    what_to_test: string;
  };
  let isSimulated = false;

  if (!isVideo && process.env.ANTHROPIC_API_KEY) {
    try {
      const base64 = Buffer.from(bytes).toString("base64");
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 },
                },
                { type: "text", text: ANALYSIS_PROMPT },
              ],
            },
          ],
        }),
      });

      if (!anthropicRes.ok) {
        throw new Error(`Anthropic API error: ${anthropicRes.status}`);
      }

      const data = await anthropicRes.json();
      const text = data.content?.[0]?.text ?? "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch (err) {
      console.error("AI analysis failed, falling back to simulated result:", err);
      result = simulatedResult();
      isSimulated = true;
    }
  } else {
    // No API key configured, or this is a video — use a clearly-labeled
    // simulated result so the flow still works end-to-end.
    result = simulatedResult();
    isSimulated = true;
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
      score: result.score,
      summary: result.summary,
      whats_working: result.whats_working,
      whats_not: result.whats_not,
      what_to_test: result.what_to_test,
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

function simulatedResult() {
  // A wide, honest-looking spread rather than clustering high — this is
  // only ever shown when no real AI provider is configured, and is
  // labeled as simulated everywhere it's displayed.
  const score = 30 + Math.floor(Math.random() * 60);
  return {
    score,
    summary: "Simulated result — connect a real AI provider for genuine analysis.",
    whats_working: "This is a placeholder result because no AI provider is configured (or this file is a video, which isn't analyzed yet).",
    whats_not: "No real creative analysis has been performed on this file.",
    what_to_test: "Add an ANTHROPIC_API_KEY environment variable to enable real AI-powered image analysis.",
  };
}
