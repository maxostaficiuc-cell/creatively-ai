import type { Creative } from "@/lib/types";
import type { SignalScore } from "@/lib/analyzeCreative";

export type CreativeHealthData = {
  score: number; // 0-100 weighted overall
  change: number | null; // % vs the prior 30-day window, null if not enough history
  signals: {
    hookStrength: number;
    visualAttention: number;
    messageClarity: number;
    ctaStrength: number;
    audienceMatch: number;
    fatigueRisk: number; // displayed inverted — LOWER is better here
  };
};

// Maps our dashboard metric names to the exact labels the AI analysis
// prompt uses in signal_scores (lib/analyzeCreative.ts). "Fatigue Risk" is
// intentionally handled separately below — the stored signal is
// "freshness" (10 = low risk), but the dashboard displays actual risk
// (lower = better), so it gets inverted at display time only.
const LABEL_MAP: Record<keyof Omit<CreativeHealthData["signals"], "fatigueRisk">, string> = {
  hookStrength: "Hook Strength",
  visualAttention: "Visual Hierarchy",
  messageClarity: "Message Clarity",
  ctaStrength: "CTA Strength",
  audienceMatch: "Audience Match",
};
const FATIGUE_LABEL = "Creative Fatigue Risk";

const WEIGHTS = {
  hookStrength: 0.2,
  visualAttention: 0.2,
  messageClarity: 0.2,
  ctaStrength: 0.15,
  audienceMatch: 0.15,
  fatigueRisk: 0.1, // weighted using the raw freshness signal, not the inverted display value
};

function findSignal(signals: SignalScore[], label: string): number | null {
  const match = signals.find((s) => s.label === label);
  return match ? match.score : null;
}

/** Average, on a 0-100 scale, of one signal across every qualifying creative. */
function averageSignal(creatives: Creative[], label: string): number | null {
  const values = creatives
    .map((c) => (c.report ? findSignal(c.report.signal_scores, label) : null))
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return (values.reduce((sum, v) => sum + v, 0) / values.length) * 10;
}

/** Weighted overall score from raw (non-inverted) averaged signals. */
function weightedScore(raw: {
  hookStrength: number;
  visualAttention: number;
  messageClarity: number;
  ctaStrength: number;
  audienceMatch: number;
  fatigueRiskRaw: number; // freshness, not risk
}): number {
  return Math.round(
    raw.hookStrength * WEIGHTS.hookStrength +
      raw.visualAttention * WEIGHTS.visualAttention +
      raw.messageClarity * WEIGHTS.messageClarity +
      raw.ctaStrength * WEIGHTS.ctaStrength +
      raw.audienceMatch * WEIGHTS.audienceMatch +
      raw.fatigueRiskRaw * WEIGHTS.fatigueRisk
  );
}

function computeForCreatives(creatives: Creative[]): number | null {
  const hookStrength = averageSignal(creatives, LABEL_MAP.hookStrength);
  const visualAttention = averageSignal(creatives, LABEL_MAP.visualAttention);
  const messageClarity = averageSignal(creatives, LABEL_MAP.messageClarity);
  const ctaStrength = averageSignal(creatives, LABEL_MAP.ctaStrength);
  const audienceMatch = averageSignal(creatives, LABEL_MAP.audienceMatch);
  const fatigueRiskRaw = averageSignal(creatives, FATIGUE_LABEL);

  if (
    hookStrength === null ||
    visualAttention === null ||
    messageClarity === null ||
    ctaStrength === null ||
    audienceMatch === null ||
    fatigueRiskRaw === null
  ) {
    return null;
  }

  return weightedScore({ hookStrength, visualAttention, messageClarity, ctaStrength, audienceMatch, fatigueRiskRaw });
}

/**
 * Computes real Creative Health from the user's own analyzed creatives —
 * never fabricated. Returns null when there isn't enough data yet, so the
 * caller can show an honest empty state instead of fake-looking analytics.
 */
export function computeCreativeHealth(creatives: Creative[]): CreativeHealthData | null {
  const qualifying = creatives.filter((c) => c.report && c.report.signal_scores?.length > 0);
  if (qualifying.length === 0) return null;

  const hookStrength = averageSignal(qualifying, LABEL_MAP.hookStrength);
  const visualAttention = averageSignal(qualifying, LABEL_MAP.visualAttention);
  const messageClarity = averageSignal(qualifying, LABEL_MAP.messageClarity);
  const ctaStrength = averageSignal(qualifying, LABEL_MAP.ctaStrength);
  const audienceMatch = averageSignal(qualifying, LABEL_MAP.audienceMatch);
  const fatigueRiskRaw = averageSignal(qualifying, FATIGUE_LABEL);

  if (
    hookStrength === null ||
    visualAttention === null ||
    messageClarity === null ||
    ctaStrength === null ||
    audienceMatch === null ||
    fatigueRiskRaw === null
  ) {
    return null;
  }

  const score = weightedScore({ hookStrength, visualAttention, messageClarity, ctaStrength, audienceMatch, fatigueRiskRaw });

  // Change vs the prior 30-day window — only shown when both windows
  // actually have data, never estimated.
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const recent = qualifying.filter((c) => now - new Date(c.created_at).getTime() <= THIRTY_DAYS);
  const prior = qualifying.filter((c) => {
    const age = now - new Date(c.created_at).getTime();
    return age > THIRTY_DAYS && age <= THIRTY_DAYS * 2;
  });

  const recentScore = recent.length > 0 ? computeForCreatives(recent) : null;
  const priorScore = prior.length > 0 ? computeForCreatives(prior) : null;

  const change =
    recentScore !== null && priorScore !== null && priorScore > 0
      ? Math.round(((recentScore - priorScore) / priorScore) * 100)
      : null;

  return {
    score,
    change,
    signals: {
      hookStrength: Math.round(hookStrength),
      visualAttention: Math.round(visualAttention),
      messageClarity: Math.round(messageClarity),
      ctaStrength: Math.round(ctaStrength),
      audienceMatch: Math.round(audienceMatch),
      fatigueRisk: Math.round(100 - fatigueRiskRaw), // inverted for display: lower = better
    },
  };
}

export type NextMoveRecommendation = {
  headline: string;
  description: string;
};

const SIGNAL_LABELS: Record<keyof Omit<CreativeHealthData["signals"], "fatigueRisk">, string> = {
  hookStrength: "hook strength",
  visualAttention: "visual attention",
  messageClarity: "message clarity",
  ctaStrength: "CTA strength",
  audienceMatch: "audience match",
};

/**
 * Identifies the user's genuinely weakest signal (excluding fatigueRisk,
 * which is framed as risk rather than strength) and names their strongest
 * one — real, derived from their actual data, not a fixed suggestion.
 */
export function getNextMoveRecommendation(health: CreativeHealthData): NextMoveRecommendation {
  const entries = Object.entries(SIGNAL_LABELS) as [keyof typeof SIGNAL_LABELS, string][];
  const scored = entries.map(([key, label]) => ({ key, label, value: health.signals[key] }));
  const weakest = scored.reduce((min, s) => (s.value < min.value ? s : min));
  const strongest = scored.reduce((max, s) => (s.value > max.value ? s : max));

  return {
    headline: `Improve your ${weakest.label}`,
    description:
      strongest.key !== weakest.key
        ? `Your creatives have strong ${strongest.label}, but ${weakest.label} is currently your weakest signal. Test a change focused specifically on that next.`
        : `${weakest.label[0].toUpperCase()}${weakest.label.slice(1)} is currently your lowest-scoring signal — a good place to focus your next test.`,
  };
}
