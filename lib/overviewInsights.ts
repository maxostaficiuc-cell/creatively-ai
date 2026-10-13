// Overview insights, derived ONLY from the user's own saved analyses
// (public.creatives rows and their stored `report`). No scores are recomputed:
// overall scores are the saved `score`; signal scores are the saved
// report.signal_scores (0–10) produced by the analysis pipeline. Wording
// marked "why" / "impact" is general advertising guidance per category; the
// recommended actions and sources are quoted from the user's actual reports.

import type { Creative } from "@/lib/types";
import type { FixItem, SignalScore } from "@/lib/analyzeCreative";

const DAY = 86_400_000;
/** A signal at or below this (out of 10) counts as a weakness worth fixing. */
export const WEAK_SIGNAL = 5;
/** Same scale as the rest of the app (cards, reports). */
export const NEEDS_WORK_SCORE = 60;

export type Analysis = Pick<Creative, "id" | "score" | "summary" | "created_at" | "file_type" | "file_url" | "platform" | "is_simulated" | "report">;

/** Real, scored analyses only (simulated/demo rows and unscored rows excluded), newest first. */
export function realAnalyses(rows: Analysis[]): Analysis[] {
  return rows
    .filter((r) => !r.is_simulated && typeof r.score === "number")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

/* ── Creative Health ─────────────────────────────────────────────────────── */

export type HealthPeriod = "30D" | "ALL";
export type HealthStats = {
  count: number;
  average: number | null;
  needsWork: number; // analyses scoring under 60, or with a High-priority fix in their report
  /** change in average score vs the previous 30 days, in points; null unless both windows have ≥2 analyses */
  trend: number | null;
  best: Analysis | null;
};

function avg(xs: number[]) {
  return xs.length ? Math.round(xs.reduce((s, v) => s + v, 0) / xs.length) : null;
}

const hasHighFix = (a: Analysis) => (a.report?.fix_items ?? []).some((f) => f.priority === "High");

export function healthStats(all: Analysis[], period: HealthPeriod, now = Date.now()): HealthStats {
  const inPeriod = period === "ALL" ? all : all.filter((a) => now - Date.parse(a.created_at) <= 30 * DAY);
  const recent = all.filter((a) => now - Date.parse(a.created_at) <= 30 * DAY);
  const prior = all.filter((a) => {
    const age = now - Date.parse(a.created_at);
    return age > 30 * DAY && age <= 60 * DAY;
  });
  const ra = avg(recent.map((a) => a.score as number));
  const pa = avg(prior.map((a) => a.score as number));
  return {
    count: inPeriod.length,
    average: avg(inPeriod.map((a) => a.score as number)),
    needsWork: inPeriod.filter((a) => (a.score as number) < NEEDS_WORK_SCORE || hasHighFix(a)).length,
    trend: period === "30D" && recent.length >= 2 && prior.length >= 2 && ra !== null && pa !== null ? ra - pa : null,
    best: inPeriod.reduce<Analysis | null>((b, a) => (!b || (a.score as number) > (b.score as number) ? a : b), null),
  };
}

/* ── Opportunities ───────────────────────────────────────────────────────── */

type Category = {
  key: string;
  title: string;
  signal: string; // exact label stored in report.signal_scores
  issue: string;
  why: string;
  impact: string;
  principle: string;
  fixWords: RegExp; // matches related fix_items when a signal has no "improve" text
};

export const CATEGORIES: Category[] = [
  {
    key: "hook",
    title: "The first-second hook",
    signal: "Hook Strength",
    issue: "Weak or unclear hook",
    why: "People decide in about a second whether to stop scrolling. If the first thing they see doesn't promise something relevant, the rest of the ad isn't seen.",
    impact: "Aims to stop more of the right people in the first second.",
    principle: "Lead with one specific benefit or tension the viewer recognises — not your logo or a generic claim.",
    fixWords: /hook|headline|opening|first (second|line|frame)|attention/i,
  },
  {
    key: "offer",
    title: "Offer strength",
    signal: "Offer Strength",
    issue: "Unconvincing offer",
    why: "Even an ad that gets attention won't convert if the reason to act now isn't clear or valuable enough.",
    impact: "Aims to give interested viewers a clearer reason to click now.",
    principle: "State what they get, what it costs or saves, and why now — in plain words.",
    fixWords: /offer|price|discount|deal|value|guarantee/i,
  },
  {
    key: "hierarchy",
    title: "Visual hierarchy",
    signal: "Visual Hierarchy",
    issue: "Poor visual hierarchy",
    why: "When several elements compete, the eye doesn't know where to land, and the key message is missed.",
    impact: "Aims to make the main message the first thing people read.",
    principle: "One focal point, one headline, one action. Size and contrast should follow that order.",
    fixWords: /hierarchy|clutter|busy|focal|layout|contrast|compet/i,
  },
  {
    key: "clarity",
    title: "Message clarity",
    signal: "Message Clarity",
    issue: "Unclear messaging",
    why: "If people can't say what you sell and why it matters within a few seconds, they move on.",
    impact: "Aims to make the product and its benefit understood at a glance.",
    principle: "Say what it is and who it's for before saying how good it is.",
    fixWords: /clar|message|confus|unclear|copy|wording/i,
  },
  {
    key: "cta",
    title: "CTA clarity",
    signal: "CTA Strength",
    issue: "Weak CTA visibility",
    why: "Interested viewers still need an obvious next step. A hidden or vague CTA loses people who were ready to act.",
    impact: "Aims to turn more interest into clicks.",
    principle: "Make the next step visible and specific: what happens when they tap.",
    fixWords: /cta|call to action|button|shop now|learn more|sign up/i,
  },
  {
    key: "differentiation",
    title: "Differentiation",
    signal: "Differentiation",
    issue: "Missing differentiation",
    why: "If the ad could belong to any competitor, viewers have no reason to choose you over the alternative they already know.",
    impact: "Aims to give people a reason to pick you specifically.",
    principle: "Show the one thing only you can claim — a feature, proof point or point of view.",
    fixWords: /different|unique|competitor|generic|stand out|usp/i,
  },
  {
    key: "audience",
    title: "Creative–audience fit",
    signal: "Audience Match",
    issue: "Audience–message mismatch",
    why: "A message aimed at no one in particular resonates with no one. The right viewer should feel the ad is for them.",
    impact: "Aims to make the intended customer feel spoken to.",
    principle: "Use the words, situations and objections of one specific customer.",
    fixWords: /audience|target|persona|customer|who it's for/i,
  },
  {
    key: "trust",
    title: "Proof and trust",
    signal: "Trust / Credibility",
    issue: "Lack of trust or proof",
    why: "Claims without evidence are easy to ignore. Proof lowers the risk people feel before buying.",
    impact: "Aims to make claims more believable.",
    principle: "Back the main claim with proof: a number, a review, a demo or a recognisable name.",
    fixWords: /trust|proof|review|testimonial|credib|evidence|social proof/i,
  },
  {
    key: "mobile",
    title: "Mobile readability",
    signal: "Mobile Readability",
    issue: "Hard to read on mobile",
    why: "Most ads are seen on a phone. Small or low-contrast text is skipped.",
    impact: "Aims to make the message readable on a small screen.",
    principle: "Check every ad at phone size: big type, few words, strong contrast.",
    fixWords: /mobile|small text|readab|legib|font size/i,
  },
];

export type OpportunitySource = { id: string; summary: string; score: number; signal: number; created_at: string };
export type Opportunity = {
  key: string;
  issue: string;
  why: string;
  impact: string;
  /** Quoted from the user's own report (the worst-affected analysis). */
  action: string | null;
  /** Quoted reason from the report, when available. */
  finding: string | null;
  flagged: number;
  outOf: number;
  averageSignal: number; // 0–10
  source: OpportunitySource;
  others: number;
};

function signal(list: SignalScore[] | undefined, label: string): SignalScore | null {
  return (list ?? []).find((s) => s.label === label && typeof s.score === "number") ?? null;
}

function matchingFix(fixes: FixItem[] | undefined, re: RegExp): FixItem | null {
  return (fixes ?? []).find((f) => re.test(`${f.issue} ${f.where} ${f.fix}`)) ?? null;
}

const nameOf = (a: Analysis) => (a.summary ?? "").trim() || (a.file_type === "video" ? "Video creative" : "Image creative");

/** Recurring weaknesses across the user's most recent analyses (default: latest 20). */
export function findOpportunities(all: Analysis[], window = 20): Opportunity[] {
  const recent = all.filter((a) => a.report?.signal_scores?.length).slice(0, window);
  type Hit = { a: Analysis; s: SignalScore };
  const groups: { c: Category; hits: Hit[]; avg: number }[] = [];
  for (const c of CATEGORIES) {
    const hits = recent
      .map((a) => ({ a, s: signal(a.report?.signal_scores, c.signal) }))
      .filter((h): h is Hit => !!h.s && (h.s.score as number) <= WEAK_SIGNAL);
    if (hits.length === 0) continue;
    hits.sort((x, y) => (x.s.score as number) - (y.s.score as number) || (x.a.score as number) - (y.a.score as number));
    groups.push({ c, hits, avg: hits.reduce((sum, h) => sum + (h.s.score as number), 0) / hits.length });
  }
  // Most widespread first, then most severe.
  groups.sort((x, y) => y.hits.length - x.hits.length || x.avg - y.avg);

  const usedSources = new Set<string>();
  return groups.map(({ c, hits, avg }) => {
    // Source: the worst-affected report, preferring one not already cited by a
    // higher-ranked opportunity, so each card points somewhere useful.
    const worst = hits.find((h) => !usedSources.has(h.a.id)) ?? hits[0];
    usedSources.add(worst.a.id);
    const fix = worst.s.improve ? null : matchingFix(worst.a.report?.fix_items, c.fixWords);
    return {
      key: c.key,
      issue: c.issue,
      why: c.why,
      impact: c.impact,
      action: worst.s.improve?.trim() || fix?.fix?.trim() || null,
      finding: worst.s.reason?.trim() || fix?.issue?.trim() || null,
      flagged: hits.length,
      outOf: recent.length,
      averageSignal: Math.round(avg * 10) / 10,
      source: { id: worst.a.id, summary: nameOf(worst.a), score: worst.a.score as number, signal: worst.s.score as number, created_at: worst.a.created_at },
      others: hits.length - 1,
    };
  });
}

/* ── What to improve next ────────────────────────────────────────────────── */

export type NextAction = {
  kind: "first" | "fix" | "opportunity" | "explore";
  title: string;
  detail: string;
  why: string;
  href: string;
  cta: string;
  source?: { id: string; summary: string; score: number };
};

export function nextAction(all: Analysis[], opportunities: Opportunity[]): NextAction {
  if (all.length === 0) {
    return {
      kind: "first",
      title: "Analyze your first creative",
      detail: "Upload one ad you're running or planning to run.",
      why: "There's nothing to compare yet — your first analysis sets the baseline every recommendation here is built from.",
      href: "/analyze",
      cta: "Analyze Creative",
    };
  }
  const recent = all.slice(0, 10);
  // The lowest-scoring recent creative that its own report says has a High-priority fix.
  const candidates = recent
    .map((a) => ({ a, f: (a.report?.fix_items ?? []).find((f) => f.priority === "High") }))
    .filter((x): x is { a: Analysis; f: FixItem } => !!x.f)
    .sort((x, y) => (x.a.score as number) - (y.a.score as number));
  if (candidates.length && (candidates[0].a.score as number) < 80) {
    const { a, f } = candidates[0];
    return {
      kind: "fix",
      title: f.issue,
      detail: f.fix,
      why: `“${nameOf(a)}” scored ${a.score}, ${
        candidates.length > 1 || recent.length > 1 ? "the lowest of your recent analyses with a high-priority fix" : "and its report marks this as a high-priority fix"
      }.${f.effort === "Quick" ? " The report rates it a quick change." : ""}`,
      href: `/my-creatives/${a.id}`,
      cta: "Open the report",
      source: { id: a.id, summary: nameOf(a), score: a.score as number },
    };
  }
  const top = opportunities[0];
  if (top && top.action) {
    return {
      kind: "opportunity",
      title: top.issue,
      detail: top.action,
      why: `Flagged in ${top.flagged} of your last ${top.outOf} analys${top.outOf === 1 ? "is" : "es"}. This suggestion comes from the report for “${top.source.summary}”.`,
      href: `/my-creatives/${top.source.id}`,
      cta: "Open the report",
      source: { id: top.source.id, summary: top.source.summary, score: top.source.score },
    };
  }
  return {
    kind: "explore",
    title: "Study new creative structures",
    detail: "Browse the Winning Ads library for an angle you haven't tested yet.",
    why: "Your recent analyses don't show a recurring weakness, so a new angle is the next thing to test.",
    href: "/winning-ads",
    cta: "Explore Winning Ads",
  };
}

/* ── Creative principles ─────────────────────────────────────────────────── */

export type Principle = { key: string; title: string; text: string; sourceId: string | null };

/** Up to 3 principles, prioritising the user's own recurring issues. */
export function principlesFor(opps: Opportunity[]): { items: Principle[]; personalised: boolean } {
  const fromUser = opps.slice(0, 3).map((o) => {
    const c = CATEGORIES.find((x) => x.key === o.key)!;
    return { key: c.key, title: c.title, text: c.principle, sourceId: o.source.id };
  });
  if (fromUser.length > 0) return { items: fromUser, personalised: true };
  const defaults = ["hook", "clarity", "cta"].map((k) => {
    const c = CATEGORIES.find((x) => x.key === k)!;
    return { key: c.key, title: c.title, text: c.principle, sourceId: null };
  });
  return { items: defaults, personalised: false };
}
