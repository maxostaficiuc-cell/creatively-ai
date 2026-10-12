// The single place the real Claude-based creative analysis logic lives.
// The authenticated dashboard, the public free-report flow, and the saved
// report detail page all read/render this same shape — there is only ever
// one AI analysis implementation, never a duplicate.
//
// v2 (report redesign): the analysis runs as TWO parallel Claude calls on the
// same image — a "diagnosis" call (score, annotated regions, strengths, fixes,
// signals, hook) and a "strategy" call (hook ideas, angles, variations,
// audiences, campaign, tests). Splitting keeps each response short enough to
// finish well inside the 30s serverless limit. normalizeReport() merges both
// and ALSO fills every legacy field, so list views, older UI and stored rows
// keep working unchanged.

export type SignalScore = {
  label: string;
  /** 0–10; null when the image doesn't give enough evidence to score it. */
  score: number | null;
  reason?: string;
  improve?: string;
};
export type HookCategory = { category: string; hooks: string[] };
export type CreativeVariation = { name: string; angle: string };

// ── v2 structured fields (all optional so older stored reports still type-check)
export type Annotation = {
  id: string;
  label: string;
  /** centre + size of an APPROXIMATE region, as fractions (0–1) of the image */
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "positive" | "negative" | "neutral";
  note: string;
};
export type StrengthItem = { title: string; evidence: string; why: string; keep: string; annotation?: string | null };
export type FixItem = {
  issue: string;
  where: string;
  why: string;
  fix: string;
  example: string;
  priority: "High" | "Medium" | "Low";
  effort: "Quick" | "Moderate" | "Substantial";
  impact: string;
  annotation?: string | null;
};
export type HookInfo = {
  text: string;
  type: string;
  clarity: "High" | "Medium" | "Low";
  specificity: "High" | "Medium" | "Low";
  emotional_angle: string;
  strength: string;
  limitation: string;
};
export type HookIdea = { category: string; hook: string; why: string; changes: string };
export type AdAngle = { name: string; message: string; hook: string; offer: string; visual: string; cta: string; hypothesis: string };
export type Improvement = { area: string; before: string; after: string };
export type VariationBrief = {
  name: string;
  focus: string;
  headline: string;
  changes: string;
  why: string;
  hypothesis: string;
  keep: string;
  layout: string;
};
export type AudienceProfile = {
  type: "Primary" | "Secondary";
  name: string;
  overview: string;
  motivations: string[];
  pain_points: string[];
  objections: string[];
  awareness: string;
  messaging: string;
  angle: string;
  evidence: string;
};
export type CampaignDetail = {
  objective: { rec: string; why: string };
  optimization: { rec: string; why: string };
  testing: { test: string; keep: string; measure: string; evidence: string };
  placements: { rec: string; why: string };
  readiness: { status: string; reasons: string[] };
};
export type TestPlanItem = {
  name: string;
  variable_isolated: string;
  hypothesis?: string;
  change?: string;
  keep?: string;
  primary_metric?: string;
  secondary_metrics?: string;
  interpret?: string;
};

export type CreativeReport = {
  // Top-line — also what's shown in list views (My Creatives, dashboard)
  score: number; // 0-100
  verdict_label: "Excellent" | "Strong" | "Average" | "Weak" | "Very Weak";
  summary: string; // one-sentence overall verdict
  whats_working: string; // kept for backward compatibility with older rows
  whats_not: string;
  what_to_test: string;

  executive_summary: string;
  biggest_strength: string;
  biggest_weakness: string;
  biggest_opportunity: string;
  campaign_readiness: string;
  strengths: string[];
  priority_fixes: string[];
  expected_impact: string; // qualitative only, never fabricated numbers

  signal_scores: SignalScore[];

  positive_factors: string[];
  negative_factors: string[];

  improvement_plan: string[];

  hook_analysis: string;
  hook_recommendations: HookCategory[];
  new_ad_angles: string[];
  creative_improvements: string[];

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

  testing_plan: TestPlanItem[];
  creative_variations: CreativeVariation[];

  final_recommendation: {
    verdict: "YES" | "YES — WITH CHANGES" | "TEST FIRST" | "NO — REWORK REQUIRED";
    reason: string;
  };
  creative_readiness_score: number;

  // ── v2 (present on reports created after the redesign)
  version?: 2;
  format?: string;
  placement_guess?: string;
  verdict?: string;
  priority_action?: string;
  summary_points?: {
    message: string;
    audience: string;
    strongest: string;
    weakest: string;
    opportunity: string;
    next_action: string;
  };
  annotations?: Annotation[];
  strength_items?: StrengthItem[];
  fix_items?: FixItem[];
  hook?: HookInfo;
  hook_ideas?: HookIdea[];
  ad_angles?: AdAngle[];
  improvements?: Improvement[];
  variations?: VariationBrief[];
  audiences?: AudienceProfile[];
  campaign?: CampaignDetail;
};

export const SIGNAL_LABELS = [
  "Hook Strength",
  "Scroll-Stop Potential",
  "Emotional Appeal",
  "Message Clarity",
  "Offer Strength",
  "CTA Strength",
  "Audience Match",
  "Visual Hierarchy",
  "Mobile Readability",
  "Brand Consistency",
  "Trust / Credibility",
  "Differentiation",
  "Creative Fatigue Risk",
] as const;

// ── Prompts ──────────────────────────────────────────────────────────────────

const VOICE = `VOICE — you are a senior performance creative strategist writing notes for a paying client. It must read like a person wrote it, not an AI.
- Plain, specific and confident. Short sentences. No filler, no hype, no motivational tone.
- Name the brand and product (e.g. "Huel's headline", "the strawberry shake"). Never write "this ad", "the creative", "this analysis", "the advertisement".
- Quote on-image text exactly, in double quotes.
- Evidence fields: only what is visible in the image. Judgement fields ("why", "impact", "hypothesis"): your professional view, stated once. One hedge at most, no stacked "may potentially".
- Never use these words or patterns: leverage, elevate, resonate, compelling, seamless, robust, unlock, game-changer, delve, crucial, vital, powerful, captivating, "it's worth noting", "not only ... but also", "in today's", "overall", "effectively", "in conclusion". No exclamation marks, emojis, markdown or em dashes.
- No performance numbers (CTR, ROAS, CPA, conversions, spend). Mention prices and claims only if they are printed in the image.
- Before saying something is missing (CTA, price, logo, proof, offer), look at the whole image again, including small print and corners. If it exists but is weak, say it is weak, not missing.
- If text is unreadable or cropped, say so instead of guessing.
- Stay within the word limits. Shorter is better.`;

const DIAGNOSIS_PROMPT = `${VOICE}

TASK — diagnose this single ad image (Meta, TikTok or Google placements). Most ads are average; use the whole scale.
SCORE BANDS: 90-100 Excellent · 80-89 Strong · 60-79 Average · 40-59 Weak · 0-39 Very Weak.

Return ONLY a JSON object, no other text:
{
  "score": <integer 0-100>,
  "verdict_label": <"Excellent"|"Strong"|"Average"|"Weak"|"Very Weak", matching the band>,
  "format": "<format and aspect ratio you can see, e.g. 'Static image, 4:5 portrait'>",
  "placement_guess": "<placements the format suits, e.g. 'Meta Feed, Instagram Feed'>",
  "verdict": "<one sentence, max 28 words: the main strength and the main problem>",
  "priority_action": "<the single most important change, imperative, max 16 words>",
  "summary_points": {
    "message": "<what the ad is saying, max 18 words>",
    "audience": "<who it appears to target, an inference, max 16 words>",
    "strongest": "<strongest element, max 16 words>",
    "weakest": "<biggest weakness, max 16 words>",
    "opportunity": "<main opportunity, max 18 words>",
    "next_action": "<recommended next action, max 16 words>"
  },
  "executive_summary": "<3 sentences, max 65 words, no repetition of the verdict wording>",
  "annotations": [
    {"id": "a1", "label": "<Headline|Product|Offer|Price|CTA|Logo|Proof|Supporting text|Visual>", "x": <0-1 centre x>, "y": <0-1 centre y>, "w": <0-1 width>, "h": <0-1 height>, "tone": "<positive|negative|neutral>", "note": "<what it does well or badly, max 20 words>"}
  ],
  "strength_items": [
    {"title": "<max 6 words>", "evidence": "<what is visible, max 18 words>", "why": "<why it helps, max 18 words>", "keep": "<how to keep it in new versions, max 14 words>", "annotation": "<annotation id or null>"}
  ],
  "fix_items": [
    {"issue": "<max 8 words>", "where": "<where in the ad>", "why": "<why it matters, max 20 words>", "fix": "<what to change, max 20 words>", "example": "<concrete copy or layout example, max 16 words>", "priority": "<High|Medium|Low>", "effort": "<Quick|Moderate|Substantial>", "impact": "<expected effect as a hypothesis, max 14 words>", "annotation": "<annotation id or null>"}
  ],
  "signal_scores": [ {"label": "<label>", "score": <integer 0-10, or null if the image gives no evidence>, "reason": "<evidence-based reason, max 16 words>", "improve": "<how to raise it, max 12 words>"} ],
  "positive_factors": [<2-4 strings, max 14 words each: what lifts the score>],
  "negative_factors": [<2-4 strings, max 14 words each: what holds it back>],
  "hook": {"text": "<exact headline, or 'No clear headline'>", "type": "<e.g. lifestyle promise, question, price-led>", "clarity": "<High|Medium|Low>", "specificity": "<High|Medium|Low>", "emotional_angle": "<max 8 words>", "strength": "<max 16 words>", "limitation": "<max 16 words>"},
  "expected_impact": "<qualitative, max 28 words, no numbers>",
  "campaign_readiness": "<short phrase, e.g. 'Ready to test', 'Fix the offer first'>",
  "final_recommendation": {"verdict": <"YES"|"YES — WITH CHANGES"|"TEST FIRST"|"NO — REWORK REQUIRED">, "reason": "<max 28 words>"},
  "creative_readiness_score": <integer 0-100>
}
RULES: annotations 3-6, only for elements you can clearly see; boxes are approximate and must sit over the element. strength_items 2-4. fix_items 3-5, highest priority first. signal_scores must contain exactly these labels in this order: ${SIGNAL_LABELS.join(", ")}. "Creative Fatigue Risk": 10 = fresh, 0 = looks overused.`;

const STRATEGY_PROMPT = `${VOICE}

TASK — write the creative strategy for this ad image: what to test next and who it is for. Every idea must fit this exact product, offer and brand. Do not repeat generic best practice.

Return ONLY a JSON object, no other text:
{
  "hook_ideas": [ {"category": "<Emotional|Curiosity|Direct response|Problem-aware|Benefit-driven>", "hook": "<new headline, max 12 words>", "why": "<why it is worth testing, max 16 words>", "changes": "<what it changes vs the current headline, max 10 words>"} ],
  "ad_angles": [ {"name": "<e.g. Price-led, Convenience-led>", "message": "<central message, max 14 words>", "hook": "<max 12 words>", "offer": "<how to present the offer, max 14 words>", "visual": "<visual direction, max 16 words>", "cta": "<max 4 words>", "hypothesis": "<max 16 words>"} ],
  "improvements": [ {"area": "<Headline|Visual|Offer|CTA|Proof|Mobile|Branding>", "before": "<what it is now, max 12 words>", "after": "<the specific change, max 16 words>"} ],
  "variations": [ {"name": "<Variation A|Variation B|Variation C>", "focus": "<Hook|Benefit|Visual|Offer>", "headline": "<proposed headline, max 12 words>", "changes": "<what changes, max 20 words>", "why": "<max 16 words>", "hypothesis": "<max 14 words>", "keep": "<what stays the same, max 12 words>", "layout": "<layout direction a designer can follow, max 24 words>"} ],
  "audiences": [ {"type": "<Primary|Secondary>", "name": "<max 7 words>", "overview": "<max 20 words>", "motivations": [<2-3, max 7 words each>], "pain_points": [<2-3>], "objections": [<1-2>], "awareness": "<Unaware|Problem aware|Solution aware|Product aware|Most aware, plus a short reason>", "messaging": "<what to say to them, max 14 words>", "angle": "<best angle, max 8 words>", "evidence": "<what in the image suggests this, max 16 words>"} ],
  "campaign": {
    "objective": {"rec": "<max 8 words>", "why": "<max 18 words; if the business goal is unknown, phrase it as conditional>"},
    "optimization": {"rec": "<max 8 words>", "why": "<max 18 words>"},
    "testing": {"test": "<which element to test, max 12 words>", "keep": "<what to keep constant, max 12 words>", "measure": "<outcome to measure, max 10 words>", "evidence": "<what result would support it, max 16 words>"},
    "placements": {"rec": "<max 10 words>", "why": "<based on aspect ratio and readability, max 16 words>"},
    "readiness": {"status": "<Ready to test|Test after fixes|Rework first>", "reasons": [<2 strings, max 12 words each>]}
  },
  "tests": [ {"name": "<Test A: short name>", "variable_isolated": "<the one variable>", "hypothesis": "<max 18 words>", "change": "<max 12 words>", "keep": "<max 12 words>", "primary_metric": "<max 6 words>", "secondary_metrics": "<max 8 words>", "interpret": "<how to read the result, max 18 words>"} ]
}
RULES: hook_ideas 4-6, only categories that fit. ad_angles 3. improvements 4-6. variations exactly 3 (A hook-focused, B benefit-focused, C visual or offer-focused). audiences 2 (one Primary, one Secondary); these are inferences from the image, not real targeting data. tests 3. No budgets or test durations.`;

// ── Claude call ──────────────────────────────────────────────────────────────

/**
 * Runs the real Claude vision analysis on an image, given its raw bytes.
 * Falls back to a clearly-labeled simulated report if no ANTHROPIC_API_KEY
 * is configured, or if the API call fails for any reason — and tells the
 * caller WHICH of those it was.
 */
export async function runCreativeAnalysis(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ result: CreativeReport; isSimulated: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { result: simulatedResult("no_key"), isSimulated: true };
  }

  try {
    const result = await analyzeWithClaude(bytes, mediaType);
    return { result, isSimulated: false };
  } catch (err) {
    console.error("AI analysis failed, falling back to simulated result:", err);
    return { result: simulatedResult("call_failed"), isSimulated: true };
  }
}

async function callClaudeJSON(base64: string, mediaType: string, prompt: string, maxTokens: number, tag: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // Current Haiku model. Override without a code change via ANTHROPIC_MODEL.
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    // Anthropic's body explains why (no credit, invalid key, rate limit…).
    // Logged server-side only; never shown to visitors.
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status} (${tag}): ${bodyText.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string = (data.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");
  if (data.stop_reason === "max_tokens") {
    throw new Error(`AI response (${tag}) was cut off at max_tokens (${text.length} chars)`);
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`AI response (${tag}) contained no JSON object (stop_reason=${data.stop_reason}, ${text.length} chars)`);
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`AI returned invalid JSON (${tag}, ${text.length} chars): ${e instanceof Error ? e.message : e}`);
  }
}

/**
 * The real Claude analysis. THROWS with a precise reason if the diagnosis
 * fails (used by the admin AI check). If only the strategy half fails, the
 * report is still returned — the strategy sections are simply left out.
 */
export async function analyzeWithClaude(bytes: Uint8Array, mediaType: string): Promise<CreativeReport> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  const base64 = Buffer.from(bytes).toString("base64");

  const [diag, strat] = await Promise.allSettled([
    callClaudeJSON(base64, mediaType, DIAGNOSIS_PROMPT, 4500, "diagnosis"),
    callClaudeJSON(base64, mediaType, STRATEGY_PROMPT, 4500, "strategy"),
  ]);
  if (diag.status === "rejected") throw diag.reason;
  if (strat.status === "rejected") console.error("AI strategy half failed (report continues without it):", strat.reason);

  return normalizeReport(diag.value, strat.status === "fulfilled" ? strat.value : {});
}

// ── Normalisation: validate, clamp, and fill legacy fields ───────────────────

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const strArr = (v: unknown): string[] => arr<unknown>(v).map((x) => str(x)).filter(Boolean);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const frac = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v > 1 ? v / 100 : v, 0, 1) : fb);
const pick = <T extends string>(v: unknown, allowed: readonly T[], fb: T): T =>
  allowed.includes(v as T) ? (v as T) : fb;


const VERDICTS = ["YES", "YES — WITH CHANGES", "TEST FIRST", "NO — REWORK REQUIRED"] as const;

function bandFor(score: number): CreativeReport["verdict_label"] {
  return score >= 90 ? "Excellent" : score >= 80 ? "Strong" : score >= 60 ? "Average" : score >= 40 ? "Weak" : "Very Weak";
}

const lowerFirst = (t: string) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);

/** Joins fragments into sentences without doubling full stops or leaving stray ones. */
function sentences(...parts: (string | false | null | undefined)[]): string {
  return parts
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
    .join(" ");
}

export function normalizeReport(d: Record<string, unknown>, s: Record<string, unknown>): CreativeReport {
  if (typeof d.score !== "number" || !Number.isFinite(d.score)) throw new Error("AI JSON is missing a numeric score");
  const score = Math.round(clamp(d.score, 0, 100));

  const annotations: Annotation[] = arr<Record<string, unknown>>(d.annotations)
    .slice(0, 6)
    .map((a, i) => ({
      id: str(a.id) || `a${i + 1}`,
      label: str(a.label, "Element"),
      x: frac(a.x, 0.5),
      y: frac(a.y, 0.5),
      w: frac(a.w, 0.3),
      h: frac(a.h, 0.15),
      tone: pick(a.tone, ["positive", "negative", "neutral"] as const, "neutral"),
      note: str(a.note),
    }))
    .filter((a) => a.note);
  const annIds = new Set(annotations.map((a) => a.id));
  const annRef = (v: unknown) => (typeof v === "string" && annIds.has(v) ? v : null);

  const strength_items: StrengthItem[] = arr<Record<string, unknown>>(d.strength_items)
    .map((x) => ({ title: str(x.title), evidence: str(x.evidence), why: str(x.why), keep: str(x.keep), annotation: annRef(x.annotation) }))
    .filter((x) => x.title);
  const fix_items: FixItem[] = arr<Record<string, unknown>>(d.fix_items)
    .map((x) => ({
      issue: str(x.issue),
      where: str(x.where),
      why: str(x.why),
      fix: str(x.fix),
      example: str(x.example),
      priority: pick(x.priority, ["High", "Medium", "Low"] as const, "Medium"),
      effort: pick(x.effort, ["Quick", "Moderate", "Substantial"] as const, "Moderate"),
      impact: str(x.impact),
      annotation: annRef(x.annotation),
    }))
    .filter((x) => x.issue);

  const sigIn = arr<Record<string, unknown>>(d.signal_scores);
  const signal_scores: SignalScore[] = SIGNAL_LABELS.map((label) => {
    const m = sigIn.find((x) => str(x.label).toLowerCase() === label.toLowerCase());
    const raw = m?.score;
    return {
      label,
      score: typeof raw === "number" && Number.isFinite(raw) ? Math.round(clamp(raw, 0, 10) * 10) / 10 : null,
      reason: str(m?.reason),
      improve: str(m?.improve),
    };
  });

  const hookRaw = (d.hook ?? {}) as Record<string, unknown>;
  const lvl = ["High", "Medium", "Low"] as const;
  const hook: HookInfo = {
    text: str(hookRaw.text, "No clear headline"),
    type: str(hookRaw.type),
    clarity: pick(hookRaw.clarity, lvl, "Medium"),
    specificity: pick(hookRaw.specificity, lvl, "Medium"),
    emotional_angle: str(hookRaw.emotional_angle),
    strength: str(hookRaw.strength),
    limitation: str(hookRaw.limitation),
  };

  const spRaw = (d.summary_points ?? {}) as Record<string, unknown>;
  const summary_points = {
    message: str(spRaw.message),
    audience: str(spRaw.audience),
    strongest: str(spRaw.strongest),
    weakest: str(spRaw.weakest),
    opportunity: str(spRaw.opportunity),
    next_action: str(spRaw.next_action),
  };

  const frRaw = (d.final_recommendation ?? {}) as Record<string, unknown>;
  const final_recommendation = {
    verdict: pick(frRaw.verdict, VERDICTS, "TEST FIRST"),
    reason: str(frRaw.reason),
  };

  // Strategy half (may be empty if that call failed)
  const hook_ideas: HookIdea[] = arr<Record<string, unknown>>(s.hook_ideas)
    .map((x) => ({ category: str(x.category, "Idea"), hook: str(x.hook), why: str(x.why), changes: str(x.changes) }))
    .filter((x) => x.hook);
  const ad_angles: AdAngle[] = arr<Record<string, unknown>>(s.ad_angles)
    .map((x) => ({
      name: str(x.name),
      message: str(x.message),
      hook: str(x.hook),
      offer: str(x.offer),
      visual: str(x.visual),
      cta: str(x.cta),
      hypothesis: str(x.hypothesis),
    }))
    .filter((x) => x.name);
  const improvements: Improvement[] = arr<Record<string, unknown>>(s.improvements)
    .map((x) => ({ area: str(x.area, "Creative"), before: str(x.before), after: str(x.after) }))
    .filter((x) => x.after);
  const variations: VariationBrief[] = arr<Record<string, unknown>>(s.variations)
    .slice(0, 3)
    .map((x, i) => ({
      name: str(x.name) || `Variation ${"ABC"[i]}`,
      focus: str(x.focus),
      headline: str(x.headline),
      changes: str(x.changes),
      why: str(x.why),
      hypothesis: str(x.hypothesis),
      keep: str(x.keep),
      layout: str(x.layout),
    }))
    .filter((x) => x.changes || x.headline);
  const audiences: AudienceProfile[] = arr<Record<string, unknown>>(s.audiences)
    .slice(0, 3)
    .map((x, i) => ({
      type: pick(x.type, ["Primary", "Secondary"] as const, i === 0 ? "Primary" : "Secondary"),
      name: str(x.name),
      overview: str(x.overview),
      motivations: strArr(x.motivations),
      pain_points: strArr(x.pain_points),
      objections: strArr(x.objections),
      awareness: str(x.awareness),
      messaging: str(x.messaging),
      angle: str(x.angle),
      evidence: str(x.evidence),
    }))
    .filter((x) => x.name || x.overview);
  const cRaw = (s.campaign ?? null) as Record<string, Record<string, unknown>> | null;
  const campaign: CampaignDetail | undefined = cRaw
    ? {
        objective: { rec: str(cRaw.objective?.rec), why: str(cRaw.objective?.why) },
        optimization: { rec: str(cRaw.optimization?.rec), why: str(cRaw.optimization?.why) },
        testing: {
          test: str(cRaw.testing?.test),
          keep: str(cRaw.testing?.keep),
          measure: str(cRaw.testing?.measure),
          evidence: str(cRaw.testing?.evidence),
        },
        placements: { rec: str(cRaw.placements?.rec), why: str(cRaw.placements?.why) },
        readiness: { status: str(cRaw.readiness?.status), reasons: strArr(cRaw.readiness?.reasons) },
      }
    : undefined;
  const tests: TestPlanItem[] = arr<Record<string, unknown>>(s.tests)
    .map((x) => ({
      name: str(x.name),
      variable_isolated: str(x.variable_isolated),
      hypothesis: str(x.hypothesis),
      change: str(x.change),
      keep: str(x.keep),
      primary_metric: str(x.primary_metric),
      secondary_metrics: str(x.secondary_metrics),
      interpret: str(x.interpret),
    }))
    .filter((x) => x.name);

  const verdict = str(d.verdict);
  const primaryAudience = audiences.find((a) => a.type === "Primary") ?? audiences[0];

  return {
    version: 2,
    score,
    // Always derived from the score so the label can never contradict the number.
    verdict_label: bandFor(score),
    format: str(d.format),
    placement_guess: str(d.placement_guess),
    verdict,
    priority_action: str(d.priority_action),
    summary_points,
    annotations,
    strength_items,
    fix_items,
    hook,
    hook_ideas,
    ad_angles,
    improvements,
    variations,
    audiences,
    campaign,

    // legacy fields (list views, older UI, emails)
    summary: verdict || summary_points.message,
    whats_working: strength_items.map((x) => x.title).join(". "),
    whats_not: fix_items.map((x) => x.issue).join(". "),
    what_to_test: tests[0]?.hypothesis || variations[0]?.changes || str(d.priority_action),
    executive_summary: str(d.executive_summary),
    biggest_strength: summary_points.strongest,
    biggest_weakness: summary_points.weakest,
    biggest_opportunity: summary_points.opportunity,
    campaign_readiness: str(d.campaign_readiness, campaign?.readiness.status ?? ""),
    strengths: strength_items.map((x) => x.title),
    priority_fixes: fix_items.map((x) => x.issue),
    expected_impact: str(d.expected_impact),
    signal_scores,
    positive_factors: strArr(d.positive_factors),
    negative_factors: strArr(d.negative_factors),
    improvement_plan: fix_items.map((x) => `${x.fix}`.trim()).filter(Boolean),
    hook_analysis: [hook.strength, hook.limitation].filter(Boolean).join(" "),
    hook_recommendations: Object.values(
      hook_ideas.reduce<Record<string, HookCategory>>((acc, h) => {
        (acc[h.category] ??= { category: h.category, hooks: [] }).hooks.push(h.hook);
        return acc;
      }, {})
    ),
    new_ad_angles: ad_angles.map((a) => `${a.name}: ${a.message}`),
    creative_improvements: improvements.map((x) => `${x.area}: ${x.after}`),
    audience_inference: {
      likely_audience: primaryAudience ? sentences(primaryAudience.name, primaryAudience.overview) : summary_points.audience,
      pain_points: primaryAudience?.pain_points ?? [],
      desires: primaryAudience?.motivations ?? [],
      awareness_level: primaryAudience?.awareness ?? "",
    },
    campaign_recommendations: {
      objective: campaign ? sentences(campaign.objective.rec, campaign.objective.why) : "",
      optimization_event: campaign ? sentences(campaign.optimization.rec, campaign.optimization.why) : "",
      testing_strategy: campaign
        ? sentences(
            campaign.testing.test,
            campaign.testing.keep && `Keep ${lowerFirst(campaign.testing.keep)}`,
            campaign.testing.measure && `Measure ${lowerFirst(campaign.testing.measure)}`
          )
        : "",
      placements: campaign ? sentences(campaign.placements.rec, campaign.placements.why) : "",
    },
    testing_plan: tests,
    creative_variations: variations.map((v) => ({ name: v.name, angle: v.focus ? `${v.focus}: ${v.changes}` : v.changes })),
    final_recommendation,
    creative_readiness_score:
      typeof d.creative_readiness_score === "number" ? Math.round(clamp(d.creative_readiness_score, 0, 100)) : score,
  };
}

/** Same simulated-result shape, used for videos (not yet really analyzed) too. */
export function simulatedResult(reason: "no_key" | "call_failed" | "video" = "call_failed"): CreativeReport {
  const score = 30 + Math.floor(Math.random() * 60);
  const verdict_label: CreativeReport["verdict_label"] =
    score >= 90 ? "Excellent" : score >= 80 ? "Strong" : score >= 60 ? "Average" : score >= 40 ? "Weak" : "Very Weak";

  const placeholder = "Simulated — connect a real AI provider for genuine, personalized analysis.";
  const whatToTest =
    reason === "no_key"
      ? "Add an ANTHROPIC_API_KEY environment variable to enable real AI-powered analysis."
      : reason === "video"
      ? "Upload an image instead for a real AI-powered analysis."
      : "The AI provider is configured, but the last request failed — this is often an Anthropic account issue (like an unfunded balance) rather than a code problem. Check the server logs for the exact reason, or try again in a moment.";

  return {
    score,
    verdict_label,
    summary: placeholder,
    whats_working: "This is a placeholder result — no real creative analysis has been performed on this file.",
    whats_not: "No real creative analysis has been performed on this file.",
    what_to_test: whatToTest,
    executive_summary: placeholder,
    biggest_strength: placeholder,
    biggest_weakness: placeholder,
    biggest_opportunity: placeholder,
    campaign_readiness: placeholder,
    strengths: [placeholder],
    priority_fixes: [placeholder],
    expected_impact: placeholder,
    signal_scores: [
      "Hook Strength", "Scroll-Stop Potential", "Message Clarity", "Visual Hierarchy",
      "Offer Strength", "CTA Strength", "Audience Match", "Brand Consistency",
      "Trust / Credibility", "Differentiation", "Emotional Appeal",
      "Mobile Readability", "Creative Fatigue Risk",
    ].map((label) => ({ label, score: Math.round((score / 10) * 10) / 10 })),
    positive_factors: [placeholder],
    negative_factors: [placeholder],
    improvement_plan: [placeholder],
    hook_analysis: placeholder,
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
    creative_readiness_score: score,
  };
}
