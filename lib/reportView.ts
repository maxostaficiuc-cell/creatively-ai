// Turns any stored CreativeReport — the new structured v2 shape or an older
// legacy row — into one view model for the report UI. Older reports simply
// have fewer details (no annotations, no evidence lines); nothing is invented
// to fill the gaps.

import type {
  AdAngle,
  Annotation,
  AudienceProfile,
  CampaignDetail,
  CreativeReport,
  FixItem,
  HookIdea,
  HookInfo,
  Improvement,
  SignalScore,
  StrengthItem,
  TestPlanItem,
  VideoDetails,
  VariationBrief,
} from "@/lib/analyzeCreative";

export type ReportView = {
  /** Video reports only: sampled frames, scenes and audio. */
  video: VideoDetails | null;
  isV2: boolean;
  score: number;
  verdictLabel: CreativeReport["verdict_label"];
  verdictText: string;
  priorityAction: string;
  format: string;
  placement: string;
  finalVerdict: CreativeReport["final_recommendation"]["verdict"];
  finalReason: string;
  readinessScore: number;
  campaignReadiness: string;
  expectedImpact: string;
  summary: { message: string; audience: string; strongest: string; weakest: string; opportunity: string; next_action: string };
  executiveSummary: string;
  annotations: Annotation[];
  strengths: StrengthItem[];
  fixes: FixItem[];
  signals: SignalScore[];
  positive: string[];
  negative: string[];
  hook: HookInfo | null;
  hookAnalysis: string;
  hookIdeas: HookIdea[];
  angles: AdAngle[];
  improvements: Improvement[];
  variations: VariationBrief[];
  audiences: AudienceProfile[];
  campaign: CampaignDetail | null;
  tests: TestPlanItem[];
};

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 } as const;

export function toReportView(r: CreativeReport): ReportView {
  const v2 = r.version === 2;

  const strengths: StrengthItem[] =
    r.strength_items && r.strength_items.length
      ? r.strength_items
      : (r.strengths ?? []).map((t) => ({ title: t, evidence: "", why: "", keep: "" }));

  const fixes: FixItem[] =
    r.fix_items && r.fix_items.length
      ? r.fix_items
      : (r.priority_fixes ?? []).map((t, i) => ({
          issue: t,
          where: "",
          why: "",
          fix: r.improvement_plan?.[i] ?? "",
          example: "",
          priority: (i === 0 ? "High" : i < 3 ? "Medium" : "Low") as FixItem["priority"],
          effort: "Moderate" as FixItem["effort"],
          impact: "",
        }));

  const hookIdeas: HookIdea[] =
    r.hook_ideas && r.hook_ideas.length
      ? r.hook_ideas
      : (r.hook_recommendations ?? []).flatMap((c) =>
          c.hooks.map((h) => ({ category: c.category, hook: h, why: "", changes: "" }))
        );

  const angles: AdAngle[] =
    r.ad_angles && r.ad_angles.length
      ? r.ad_angles
      : (r.new_ad_angles ?? []).map((a) => {
          const [name, ...rest] = a.split(":");
          return rest.length
            ? { name: name.trim(), message: rest.join(":").trim(), hook: "", offer: "", visual: "", cta: "", hypothesis: "" }
            : { name: "Angle", message: a, hook: "", offer: "", visual: "", cta: "", hypothesis: "" };
        });

  const improvements: Improvement[] =
    r.improvements && r.improvements.length
      ? r.improvements
      : (r.creative_improvements ?? []).map((c) => ({ area: "", before: "", after: c }));

  const variations: VariationBrief[] =
    r.variations && r.variations.length
      ? r.variations
      : (r.creative_variations ?? []).map((v) => ({
          name: v.name,
          focus: "",
          headline: "",
          changes: v.angle,
          why: "",
          hypothesis: "",
          keep: "",
          layout: "",
        }));

  const audiences: AudienceProfile[] =
    r.audiences && r.audiences.length
      ? r.audiences
      : r.audience_inference?.likely_audience
      ? [
          {
            type: "Primary",
            name: "Likely audience",
            overview: r.audience_inference.likely_audience,
            motivations: r.audience_inference.desires ?? [],
            pain_points: r.audience_inference.pain_points ?? [],
            objections: [],
            awareness: r.audience_inference.awareness_level ?? "",
            messaging: "",
            angle: "",
            evidence: "",
          },
        ]
      : [];

  const lc = r.campaign_recommendations;
  const campaign: CampaignDetail | null =
    r.campaign ??
    (lc && (lc.objective || lc.placements)
      ? {
          objective: { rec: lc.objective, why: "" },
          optimization: { rec: lc.optimization_event, why: "" },
          testing: { test: lc.testing_strategy, keep: "", measure: "", evidence: "" },
          placements: { rec: lc.placements, why: "" },
          readiness: { status: r.campaign_readiness ?? "", reasons: [] },
        }
      : null);

  const sp = r.summary_points;
  return {
    isV2: v2,
    score: r.score,
    verdictLabel: r.verdict_label,
    verdictText: r.verdict || r.summary,
    priorityAction: r.priority_action || fixes[0]?.fix || r.improvement_plan?.[0] || "",
    video: r.video ?? null,
    format: r.format ?? "",
    placement: r.placement_guess ?? "",
    finalVerdict: r.final_recommendation?.verdict ?? "TEST FIRST",
    finalReason: r.final_recommendation?.reason ?? "",
    readinessScore: r.creative_readiness_score ?? r.score,
    campaignReadiness: r.campaign_readiness ?? "",
    expectedImpact: r.expected_impact ?? "",
    summary: {
      // Older reports have no separate "message"/"next action" fields; reusing the
      // verdict or first fix there would repeat text shown in the overview.
      message: sp?.message || "",
      audience: sp?.audience || r.audience_inference?.likely_audience || "",
      strongest: sp?.strongest || r.biggest_strength || "",
      weakest: sp?.weakest || r.biggest_weakness || "",
      opportunity: sp?.opportunity || r.biggest_opportunity || "",
      next_action: sp?.next_action || "",
    },
    executiveSummary: r.executive_summary ?? "",
    annotations: r.annotations ?? [],
    strengths,
    fixes: [...fixes].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]),
    signals: r.signal_scores ?? [],
    positive: r.positive_factors ?? [],
    negative: r.negative_factors ?? [],
    hook: r.hook ?? null,
    hookAnalysis: r.hook_analysis ?? "",
    hookIdeas,
    angles,
    improvements,
    variations,
    audiences,
    campaign,
    tests: r.testing_plan ?? [],
  };
}

/** Signal groups for the breakdown. Unknown labels fall into the last group. */
export const SIGNAL_GROUPS: { name: string; labels: string[] }[] = [
  { name: "Hook & attention", labels: ["Hook Strength", "Scroll-Stop Potential", "Emotional Appeal"] },
  { name: "Message & offer", labels: ["Message Clarity", "Offer Strength", "CTA Strength", "Audience Match"] },
  { name: "Visual & brand", labels: ["Visual Hierarchy", "Mobile Readability", "Brand Consistency"] },
  { name: "Trust & differentiation", labels: ["Trust / Credibility", "Differentiation", "Creative Fatigue Risk"] },
];
