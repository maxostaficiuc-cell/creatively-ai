// The single place the real Claude-based creative analysis logic lives.
// The authenticated dashboard, the public free-report flow, and the saved
// report detail page all read/render this same shape — there is only ever
// one AI analysis implementation, never a duplicate.

export type SignalScore = { label: string; score: number }; // score out of 10
export type HookCategory = { category: string; hooks: string[] };
export type CreativeVariation = { name: string; angle: string };

export type CreativeReport = {
  // Top-line — also what's shown in list views (My Creatives, dashboard)
  score: number; // 0-100
  verdict_label: "Excellent" | "Strong" | "Average" | "Weak" | "Very Weak";
  summary: string; // one-sentence overall verdict
  whats_working: string; // kept for backward compatibility with older rows
  whats_not: string;
  what_to_test: string;

  // Deep report — everything below is new
  executive_summary: string;
  strengths: string[]; // 3-5 specific strengths
  priority_fixes: string[]; // 3-5 highest-impact weaknesses
  expected_impact: string; // qualitative only, never fabricated numbers

  signal_scores: SignalScore[]; // Hook, Visual Hierarchy, Offer, CTA, etc. out of 10

  positive_factors: string[]; // why the score isn't lower
  negative_factors: string[]; // why the score isn't higher

  improvement_plan: string[]; // prioritized, each explains what/why/how in one line

  hook_recommendations: HookCategory[]; // Emotional / Curiosity / Direct Response / etc.
  new_ad_angles: string[];
  creative_improvements: string[]; // concrete visual changes

  audience_inference: {
    likely_audience: string;
    pain_points: string[];
    desires: string[];
    awareness_level: string;
  }; // ALWAYS labeled as AI inference in the UI, never claimed as fact

  campaign_recommendations: {
    objective: string;
    optimization_event: string;
    testing_strategy: string;
    placements: string;
  };

  testing_plan: { name: string; variable_isolated: string }[];
  creative_variations: CreativeVariation[];

  final_recommendation: {
    verdict: "YES" | "YES — WITH CHANGES" | "TEST FIRST" | "NO — REWORK REQUIRED";
    reason: string;
  };
};

const ANALYSIS_PROMPT = `You are a senior performance-marketing creative strategist producing a professional advertising intelligence report for a single ad creative (used on Meta, TikTok, or Google). You have reviewed thousands of ads. Most are mediocre — be BRUTALLY HONEST.

SCORING SCALE (use the full range — do not cluster in the 70s-80s):
90-100 Excellent · 80-89 Strong · 60-79 Average · 40-59 Weak · 0-39 Very Weak

Ground every observation in what you actually see in the image — real headline text, real offer, real colors, real layout, real CTA wording. Never write generic marketing advice that could apply to any ad. If the creative shows a specific offer (e.g. "30% off"), reference that exact offer throughout.

Be explicit that audience_inference is an AI GUESS based on visual signals only, not verified data. Be explicit that campaign_recommendations are suggestions, not knowledge of the advertiser's actual account. NEVER invent performance numbers (CTR, CPC, ROAS, spend, conversions) — you have no access to real performance data; use qualitative language like "likely to" / "could improve" / "may strengthen" instead.

Respond with ONLY a JSON object, no other text, matching EXACTLY this shape (all fields required, arrays should have the counts noted):

{
  "score": <integer 0-100>,
  "verdict_label": <"Excellent"|"Strong"|"Average"|"Weak"|"Very Weak", matching the score band above>,
  "summary": "<one sentence overall verdict>",
  "whats_working": "<2-3 sentences, specific strengths>",
  "whats_not": "<2-3 sentences, biggest conversion problem first>",
  "what_to_test": "<2-3 sentences, specific next tests>",
  "executive_summary": "<3-4 sentences: what was analyzed and the personalized conclusion, referencing the actual offer/product shown>",
  "strengths": [<3 to 5 short specific strength strings>],
  "priority_fixes": [<3 to 5 short specific weakness strings, highest-impact first>],
  "expected_impact": "<1-2 sentences using qualitative language only — 'likely to', 'could improve' — never invented numbers>",
  "signal_scores": [
    {"label": "Hook Strength", "score": <0-10>},
    {"label": "Scroll-Stop Potential", "score": <0-10>},
    {"label": "Message Clarity", "score": <0-10>},
    {"label": "Visual Hierarchy", "score": <0-10>},
    {"label": "Offer Strength", "score": <0-10>},
    {"label": "CTA Strength", "score": <0-10>},
    {"label": "Audience Match", "score": <0-10>},
    {"label": "Brand Consistency", "score": <0-10>},
    {"label": "Differentiation", "score": <0-10>},
    {"label": "Emotional Appeal", "score": <0-10>}
  ],
  "positive_factors": [<2-4 short strings: specific signals that increased the score>],
  "negative_factors": [<2-4 short strings: specific signals that reduced the score>],
  "improvement_plan": [<3-5 short strings, each stating what to change and why, ordered by priority>],
  "hook_recommendations": [
    {"category": "Emotional", "hooks": [<1-2 personalized alternative hooks referencing the actual offer>]},
    {"category": "Curiosity", "hooks": [<1-2>]},
    {"category": "Direct Response", "hooks": [<1-2>]},
    {"category": "Problem Awareness", "hooks": [<1-2>]},
    {"category": "Benefit Driven", "hooks": [<1-2>]}
  ],
  "new_ad_angles": [<3-5 short strings: alternative creative angles personalized to this offer>],
  "creative_improvements": [<3-5 short strings: concrete visual changes>],
  "audience_inference": {
    "likely_audience": "<1 sentence, framed as an inference>",
    "pain_points": [<2-3 short strings>],
    "desires": [<2-3 short strings>],
    "awareness_level": "<one of: Unaware, Problem Aware, Solution Aware, Product Aware, Most Aware — with a short reason>"
  },
  "campaign_recommendations": {
    "objective": "<short recommendation>",
    "optimization_event": "<short recommendation>",
    "testing_strategy": "<short recommendation>",
    "placements": "<short recommendation>"
  },
  "testing_plan": [
    {"name": "Test A: Current creative", "variable_isolated": "Baseline"},
    {"name": "Test B: <short description>", "variable_isolated": "<what this isolates>"},
    {"name": "Test C: <short description>", "variable_isolated": "<what this isolates>"},
    {"name": "Test D: <short description>", "variable_isolated": "<what this isolates>"}
  ],
  "creative_variations": [
    {"name": "Variation 1", "angle": "Hook-focused — <short specific description>"},
    {"name": "Variation 2", "angle": "Benefit-focused — <short specific description>"},
    {"name": "Variation 3", "angle": "Pain-focused — <short specific description>"},
    {"name": "Variation 4", "angle": "Social-proof-focused — <short specific description>"}
  ],
  "final_recommendation": {
    "verdict": <"YES"|"YES — WITH CHANGES"|"TEST FIRST"|"NO — REWORK REQUIRED">,
    "reason": "<1-2 sentences explaining the verdict>"
  }
}`;

/**
 * Runs the real Claude vision analysis on an image, given its raw bytes.
 * Falls back to a clearly-labeled simulated report if no ANTHROPIC_API_KEY
 * is configured, or if the API call fails for any reason.
 */
export async function runCreativeAnalysis(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ result: CreativeReport; isSimulated: boolean }> {
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
        max_tokens: 3000,
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
    const result = JSON.parse(cleaned) as CreativeReport;
    return { result, isSimulated: false };
  } catch (err) {
    console.error("AI analysis failed, falling back to simulated result:", err);
    return { result: simulatedResult(), isSimulated: true };
  }
}

/** Same simulated-result shape, used for videos (not yet really analyzed) too. */
export function simulatedResult(): CreativeReport {
  const score = 30 + Math.floor(Math.random() * 60);
  const verdict_label: CreativeReport["verdict_label"] =
    score >= 90 ? "Excellent" : score >= 80 ? "Strong" : score >= 60 ? "Average" : score >= 40 ? "Weak" : "Very Weak";

  const placeholder = "Simulated — connect a real AI provider for genuine, personalized analysis.";
  return {
    score,
    verdict_label,
    summary: placeholder,
    whats_working: "This is a placeholder result because no AI provider is configured right now.",
    whats_not: "No real creative analysis has been performed on this file.",
    what_to_test: "Add an ANTHROPIC_API_KEY environment variable to enable real AI-powered analysis.",
    executive_summary: placeholder,
    strengths: [placeholder],
    priority_fixes: [placeholder],
    expected_impact: placeholder,
    signal_scores: [
      "Hook Strength", "Scroll-Stop Potential", "Message Clarity", "Visual Hierarchy",
      "Offer Strength", "CTA Strength", "Audience Match", "Brand Consistency",
      "Differentiation", "Emotional Appeal",
    ].map((label) => ({ label, score: Math.round((score / 10) * 10) / 10 })),
    positive_factors: [placeholder],
    negative_factors: [placeholder],
    improvement_plan: [placeholder],
    hook_recommendations: [{ category: "Simulated", hooks: [placeholder] }],
    new_ad_angles: [placeholder],
    creative_improvements: [placeholder],
    audience_inference: {
      likely_audience: placeholder,
      pain_points: [placeholder],
      desires: [placeholder],
      awareness_level: placeholder,
    },
    campaign_recommendations: {
      objective: placeholder,
      optimization_event: placeholder,
      testing_strategy: placeholder,
      placements: placeholder,
    },
    testing_plan: [{ name: "Test A: Current creative", variable_isolated: "Baseline" }],
    creative_variations: [{ name: "Variation 1", angle: placeholder }],
    final_recommendation: { verdict: "TEST FIRST", reason: placeholder },
  };
}
