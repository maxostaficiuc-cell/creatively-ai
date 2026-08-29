import type { Creative } from "@/lib/types";

export type TrendPoint = { label: string; score: number | null };
export type PerformancePeriod = "30D" | "60D" | "90D";

const PERIOD_DAYS: Record<PerformancePeriod, number> = { "30D": 30, "60D": 60, "90D": 90 };
const BUCKET_COUNT = 6;

/**
 * Buckets the user's real analyzed creatives into 6 even time windows
 * across the selected period and averages the score within each. A
 * bucket with no analyses in it is null rather than guessed — the chart
 * shows a gap, not an invented smooth line. Returns null entirely if
 * there isn't enough real data across the period to plot anything
 * meaningful.
 */
export function computeScoreTrend(creatives: Creative[], period: PerformancePeriod): TrendPoint[] | null {
  const days = PERIOD_DAYS[period];
  const now = Date.now();
  const windowStart = now - days * 24 * 60 * 60 * 1000;
  const bucketMs = (days * 24 * 60 * 60 * 1000) / BUCKET_COUNT;

  const inWindow = creatives.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return t >= windowStart && c.score !== null;
  });

  if (inWindow.length === 0) return null;

  const buckets: { sum: number; count: number }[] = Array.from({ length: BUCKET_COUNT }, () => ({
    sum: 0,
    count: 0,
  }));

  for (const c of inWindow) {
    const t = new Date(c.created_at).getTime();
    const idx = Math.min(BUCKET_COUNT - 1, Math.floor((t - windowStart) / bucketMs));
    buckets[idx].sum += c.score ?? 0;
    buckets[idx].count += 1;
  }

  return buckets.map((b, i) => ({
    label: `${Math.round((days / BUCKET_COUNT) * (i + 1))}d`,
    score: b.count > 0 ? Math.round(b.sum / b.count) : null,
  }));
}

/** % change from the first real point to the last real point in a trend. */
export function trendChangePercent(points: TrendPoint[]): number | null {
  const real = points.filter((p): p is { label: string; score: number } => p.score !== null);
  if (real.length < 2) return null;
  const first = real[0].score;
  const last = real[real.length - 1].score;
  if (first === 0) return null;
  return Math.round(((last - first) / first) * 100);
}
