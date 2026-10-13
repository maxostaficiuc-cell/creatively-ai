// Score history for the "Creative Score Over Time" chart.
//
// Data source: the user's own rows in public.creatives (one row per completed
// analysis). Fields used: `score` (0-100, the same score shown on every report
// and card — never recomputed here), `created_at` (timestamptz, when the
// analysis was saved), `summary` (shown as the creative's name, as elsewhere in
// the dashboard), `file_type` and `platform`. Rows without a score (e.g. videos
// that were saved without an AI score) and simulated/demo rows are left out.
//
// Every point is ONE real analysis. Nothing is averaged into buckets and no
// value is ever filled in between analyses.
//
// Time zone strategy: ranges are rolling windows that end "now", measured in
// absolute time (UTC instants), so 1D = the last 24 hours including the current
// partial day, wherever the viewer is. Labels and tooltips are formatted in the
// viewer's own time zone in the browser.

export type PerformanceRange = "1D" | "3D" | "7D" | "30D";

export const PERFORMANCE_RANGES: { id: PerformanceRange; hours: number; label: string }[] = [
  { id: "1D", hours: 24, label: "last 24 hours" },
  { id: "3D", hours: 72, label: "last 3 days" },
  { id: "7D", hours: 168, label: "last 7 days" },
  { id: "30D", hours: 720, label: "last 30 days" },
];

/** The longest range — the server only needs to load this much history. */
export const MAX_RANGE_HOURS = 720;

export type ScoreRow = {
  id: string;
  score: number | null;
  created_at: string;
  summary: string | null;
  file_type: "image" | "video" | string | null;
  platform: string | null;
  is_simulated?: boolean | null;
};

export type ScorePoint = {
  id: string;
  score: number;
  /** ms since epoch */
  t: number;
  name: string;
  format: string;
  platform: string | null;
};

/** Converts saved analysis rows into chart points, oldest first. */
export function toScorePoints(rows: ScoreRow[]): ScorePoint[] {
  const out: ScorePoint[] = [];
  for (const r of rows) {
    if (r.is_simulated) continue;
    if (typeof r.score !== "number" || !Number.isFinite(r.score)) continue;
    const t = Date.parse(r.created_at);
    if (!Number.isFinite(t)) continue;
    out.push({
      id: r.id,
      score: Math.max(0, Math.min(100, Math.round(r.score))),
      t,
      name: (r.summary ?? "").trim() || (r.file_type === "video" ? "Video creative" : "Image creative"),
      format: r.file_type === "video" ? "Video" : "Static",
      platform: r.platform,
    });
  }
  return out.sort((a, b) => a.t - b.t || a.id.localeCompare(b.id));
}

export function rangeHours(range: PerformanceRange): number {
  return PERFORMANCE_RANGES.find((r) => r.id === range)?.hours ?? 720;
}

/**
 * Points inside a rolling window ending at `now`. A small allowance for clock
 * skew keeps an analysis saved "just now" from being dropped.
 */
export function pointsInRange(points: ScorePoint[], range: PerformanceRange, now: number = Date.now()): ScorePoint[] {
  const start = now - rangeHours(range) * 3_600_000;
  const end = now + 5 * 60_000;
  return points.filter((p) => p.t > start && p.t <= end);
}

export type RangeSummary = {
  count: number;
  average: number;
  high: number;
  low: number;
  /** latest score minus the first score in the range, in score points; null with <2 analyses */
  change: number | null;
};

export function summarize(points: ScorePoint[]): RangeSummary | null {
  if (points.length === 0) return null;
  const scores = points.map((p) => p.score);
  return {
    count: points.length,
    average: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    high: Math.max(...scores),
    low: Math.min(...scores),
    change: points.length >= 2 ? points[points.length - 1].score - points[0].score : null,
  };
}

/** The smallest range (larger than `range`) that contains data, for the empty state. */
export function nearestRangeWithData(points: ScorePoint[], range: PerformanceRange, now: number = Date.now()): PerformanceRange | null {
  const idx = PERFORMANCE_RANGES.findIndex((r) => r.id === range);
  for (const r of PERFORMANCE_RANGES.slice(idx + 1)) {
    if (pointsInRange(points, r.id, now).length > 0) return r.id;
  }
  return null;
}
