// The single place the real Claude-based creative analysis logic lives.
// Both the authenticated dashboard analyze route AND the public marketing
// site demo call this same function — there is only ever one AI analysis
// implementation, never a duplicate.

export type CreativeAnalysisResult = {
  score: number;
  summary: string;
  whats_working: string;
  whats_not: string;
  what_to_test: string;
};

const ANALYSIS_PROMPT = `You are a senior performance-marketing creative strategist reviewing a single advertising creative (used as a paid ad on Meta, TikTok, or Google). You have reviewed thousands of ads and know most ads are mediocre.

Be BRUTALLY HONEST. Most ads should score in the 40-75 range. Reserve 85+ for genuinely exceptional creative — a strong hook, clear offer, sharp visual execution, and real conversion potential all present at once. That combination is rare. A merely polished-looking ad with weak messaging or no clear offer should score 50-65, not 80+. A generic, unfocused, or poorly targeted ad can and should score below 40.

Evaluate across these dimensions, using what you actually see in the image (specific colors, copy, layout, offer, CTA, product framing) — never generic praise:

1. HOOK — Does it grab attention immediately? Is the headline compelling and clear within seconds? Does it stop the scroll?
2. OFFER — Is there a clear, specific value proposition? A reason to act now?
3. CREATIVE QUALITY — Visual hierarchy, composition, readability, branding consistency, contrast.
4. CONVERSION POTENTIAL — CTA clarity and visual emphasis, trust signals, social proof, objection handling, urgency.
5. AUDIENCE FIT — Does it speak to a specific audience, or feel generic?
6. DIFFERENTIATION — Does it look like every other ad in this category, or does it have a distinct angle?

In your written feedback, prioritize actionable criticism over compliments. Instead of "Great visual design," say something like "Strong product photography, but the headline communicates almost no customer benefit — a viewer can see what the product is without understanding why they should buy it." Instead of "Good CTA," say "The CTA is visible, but 'Learn More' creates weak purchase intent — test a benefit-driven CTA tied to the specific offer, and give it more visual emphasis."

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "score": <integer 0-100, following the strict, discriminating scale above>,
  "summary": "<one honest sentence verdict — name the single biggest issue or strength>",
  "whats_working": "<2-3 sentences on genuine, specific strengths — skip this if there are none worth naming>",
  "whats_not": "<2-3 sentences identifying the biggest conversion problem first, then messaging or visual issues, with specifics>",
  "what_to_test": "<2-3 sentences with specific, actionable next tests to improve ROAS>"
}`;

/**
 * Runs the real Claude vision analysis on an image, given its raw bytes.
 * Falls back to a clearly-labeled simulated result if no ANTHROPIC_API_KEY
 * is configured, or if the API call fails for any reason — the caller is
 * told via `isSimulated` so it can label the result honestly.
 */
export async function runCreativeAnalysis(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ result: CreativeAnalysisResult; isSimulated: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { result: simulatedResult(), isSimulated: true };
  }

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
                source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 },
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
    const result = JSON.parse(cleaned) as CreativeAnalysisResult;
    return { result, isSimulated: false };
  } catch (err) {
    console.error("AI analysis failed, falling back to simulated result:", err);
    return { result: simulatedResult(), isSimulated: true };
  }
}

function simulatedResult(): CreativeAnalysisResult {
  // A wide, honest-looking spread rather than clustering high — this is
  // only ever shown when no real AI provider is configured (or the call
  // failed), and is labeled as simulated everywhere it's displayed.
  const score = 30 + Math.floor(Math.random() * 60);
  return {
    score,
    summary: "Simulated result — connect a real AI provider for genuine analysis.",
    whats_working: "This is a placeholder result because no AI provider is configured right now.",
    whats_not: "No real creative analysis has been performed on this file.",
    what_to_test: "Add an ANTHROPIC_API_KEY environment variable to enable real AI-powered image analysis.",
  };
}
