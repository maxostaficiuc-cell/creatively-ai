"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AlertCircle, ArrowRight, List, LineChart as LineIcon, RotateCw } from "lucide-react";
import {
  PERFORMANCE_RANGES,
  nearestRangeWithData,
  pointsInRange,
  summarize,
  type PerformanceRange,
  type ScorePoint,
} from "@/lib/creativePerformanceTrend";

// "Creative Score Over Time". Every dot is one real, saved analysis from the
// user's own history (see lib/creativePerformanceTrend.ts). Points are spaced
// in the order the analyses were completed, so several analyses made minutes
// apart never pile on top of each other; the real date and time of each one is
// on the axis labels, in the tooltip and in the list view.

const HEIGHT = 220;
const PAD = { top: 14, right: 18, bottom: 30, left: 36 };
const Y_TICKS = [0, 25, 50, 75, 100];

export function CreativePerformanceChart({ points, error = false }: { points: ScorePoint[]; error?: boolean }) {
  const router = useRouter();
  const [range, setRange] = useState<PerformanceRange>("30D");
  const [now, setNow] = useState<number | null>(null); // set after mount → no server/client time-zone mismatch
  const [view, setView] = useState<"chart" | "list">("chart");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000); // keep rolling windows honest on a long-open tab
    return () => clearInterval(id);
  }, []);

  useEffect(() => setRetrying(false), [points, error]);

  const visible = useMemo(() => (now === null ? [] : pointsInRange(points, range, now)), [points, range, now]);
  const summary = useMemo(() => summarize(visible), [visible]);
  const rangeMeta = PERFORMANCE_RANGES.find((r) => r.id === range)!;
  const fallbackRange = now !== null && visible.length === 0 ? nearestRangeWithData(points, range, now) : null;

  return (
    <section aria-labelledby="cp-title" className="ov-reveal">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="cp-title" className="font-medium text-ink-primary">
            Creative Performance
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">How your creative scores have changed over time.</p>
        </div>
        <div role="group" aria-label="Date range" className="flex items-center gap-1 rounded-full border border-base-border bg-base-card p-1">
          {PERFORMANCE_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                range === r.id ? "bg-base-surface text-ink-primary shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]" : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-base-border bg-base-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Creative score over time</p>
          {!error && visible.length > 0 && (
            <button
              type="button"
              onClick={() => setView(view === "chart" ? "list" : "chart")}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-secondary transition-colors hover:bg-base-surface hover:text-ink-primary"
            >
              {view === "chart" ? <List size={13} /> : <LineIcon size={13} />}
              {view === "chart" ? "View as list" : "View chart"}
            </button>
          )}
        </div>

        {error ? (
          <div role="alert" className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle size={20} className="text-accent-red" />
            <p className="text-sm text-ink-primary">Your score history couldn&apos;t be loaded.</p>
            <p className="max-w-xs text-xs text-ink-muted">Your analyses are safe — this was a problem reading them, not saving them.</p>
            <button
              type="button"
              onClick={() => {
                setRetrying(true);
                router.refresh();
              }}
              className="mt-1 flex items-center gap-1.5 rounded-lg border border-base-border px-3 py-1.5 text-xs text-ink-secondary hover:border-brand/40 hover:text-ink-primary"
            >
              <RotateCw size={12} className={retrying ? "animate-spin" : ""} /> Try again
            </button>
          </div>
        ) : now === null ? (
          <ChartSkeleton />
        ) : visible.length === 0 ? (
          <div className="cp-swap flex h-[220px] flex-col items-center justify-center gap-2 text-center" key={`empty-${range}`}>
            {points.length === 0 ? (
              <>
                <p className="text-sm text-ink-primary">No analyses yet</p>
                <p className="max-w-xs text-xs text-ink-muted">Each creative you analyze becomes a point here, so you can see your scores move over time.</p>
                <Link href="/analyze" className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-light hover:underline">
                  Analyze your first creative <ArrowRight size={13} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-primary">No analyses in the {rangeMeta.label}</p>
                <p className="max-w-xs text-xs text-ink-muted">Your earlier analyses are still saved — pick a longer range to see them.</p>
                {fallbackRange && (
                  <button type="button" onClick={() => setRange(fallbackRange)} className="mt-2 text-sm text-brand-light hover:underline">
                    Show {fallbackRange}
                  </button>
                )}
              </>
            )}
          </div>
        ) : view === "list" ? (
          <ScoreList points={visible} />
        ) : (
          <ScoreChart key={range} points={visible} range={range} onOpen={(id) => router.push(`/my-creatives/${id}`)} />
        )}

        {!error && summary && (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-base-border pt-4 text-xs sm:flex sm:flex-wrap sm:items-baseline">
            <div>
              <dt className="text-ink-muted">Average score</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-ink-primary">{summary.average}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Analyses</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-ink-primary">{summary.count}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Range</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-ink-primary">
                {summary.low}–{summary.high}
              </dd>
            </div>
            {summary.change !== null && (
              <div>
                <dt className="text-ink-muted">Latest vs first</dt>
                <dd
                  className={`mt-0.5 text-sm font-medium tabular-nums ${
                    summary.change > 0 ? "text-accent-green" : summary.change < 0 ? "text-accent-red" : "text-ink-primary"
                  }`}
                >
                  {summary.change > 0 ? "+" : ""}
                  {summary.change} pts
                </dd>
              </div>
            )}
            <p className="col-span-2 text-ink-muted sm:ml-auto">Each point is one analysis in the {rangeMeta.label}.</p>
          </dl>
        )}
      </div>
    </section>
  );
}

/* ── chart ──────────────────────────────────────────────────────────────── */

function ScoreChart({ points, range, onOpen }: { points: ScorePoint[]; range: PerformanceRange; onOpen: (id: string) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const inset = n === 1 ? 0 : Math.min(18, plotW / (n * 2));
  const xAt = (i: number) => (n === 1 ? PAD.left + plotW / 2 : PAD.left + inset + (i * (plotW - inset * 2)) / (n - 1));
  const yAt = (s: number) => PAD.top + plotH - (s / 100) * plotH;
  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.score) }));

  const line = n > 1 ? monotonePath(coords) : "";
  const area = n > 1 ? `${line} L ${coords[n - 1].x} ${PAD.top + plotH} L ${coords[0].x} ${PAD.top + plotH} Z` : "";
  const labels = pickLabels(points, range, plotW);
  const dotR = n > 60 ? 2.5 : n > 25 ? 3 : 4;

  const nearest = (clientX: number) => {
    const el = wrapRef.current;
    if (!el || n === 0) return null;
    const x = clientX - el.getBoundingClientRect().left;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(coords[i].x - x) < Math.abs(coords[best].x - x)) best = i;
    return best;
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => setActive(nearest(e.clientX));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setActive((a) => (a === null ? (d > 0 ? 0 : n - 1) : Math.max(0, Math.min(n - 1, a + d))));
    } else if (e.key === "Enter" && active !== null) {
      onOpen(points[active].id);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const a = active !== null ? points[active] : null;
  const ac = active !== null ? coords[active] : null;
  // Tooltip sits beside the point (never on top of it): to the left on the right
  // half, to the right on the left half; above/below only when there's no room.
  const TIP_W = 220;
  const TIP_H = 108;
  let tipLeft = 0;
  let tipTop = 0;
  if (ac) {
    const side = ac.x > width / 2 ? ac.x - 18 - TIP_W : ac.x + 18;
    if (side >= 0 && side + TIP_W <= width) {
      tipLeft = side;
      tipTop = Math.max(0, Math.min(HEIGHT - TIP_H, ac.y - TIP_H / 2));
    } else {
      tipLeft = Math.max(0, Math.min(width - TIP_W, ac.x - TIP_W / 2));
      tipTop = ac.y > HEIGHT / 2 ? Math.max(0, ac.y - TIP_H - 16) : ac.y + 16;
    }
  }

  return (
    <div
      ref={wrapRef}
      className="cp-chart relative mt-3 select-none outline-none focus-visible:rounded-xl focus-visible:ring-1 focus-visible:ring-brand/50"
      style={{ height: HEIGHT, touchAction: "pan-y" }}
      tabIndex={0}
      role="img"
      aria-label={`Creative scores for ${n} analys${n === 1 ? "is" : "es"}. Use the left and right arrow keys to step through them.`}
      onPointerMove={onMove}
      onPointerDown={onMove}
      onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
      onClick={() => {
        if (active !== null && window.matchMedia("(hover: hover)").matches) onOpen(points[active].id);
      }}
    >
      {width > 0 && (
        <svg width={width} height={HEIGHT} className="absolute inset-0 overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="cpArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {Y_TICKS.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)} stroke="#242429" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={PAD.left - 10} y={yAt(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px] tabular-nums">
                {t}
              </text>
            </g>
          ))}

          {labels.map((l) => (
            <text key={l.i} x={xAt(l.i)} y={HEIGHT - 8} textAnchor={l.anchor} className="fill-ink-muted text-[10.5px]">
              {l.text}
            </text>
          ))}

          {area && <path d={area} fill="url(#cpArea)" className="cp-area" />}
          {line && (
            <path
              d={line}
              pathLength={1}
              fill="none"
              stroke="#A78BFA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="cp-line"
            />
          )}

          {ac && <line x1={ac.x} x2={ac.x} y1={PAD.top} y2={PAD.top + plotH} stroke="#A78BFA" strokeOpacity="0.35" strokeWidth="1" />}

          {coords.map((c, i) => (
            <circle
              key={points[i].id}
              cx={c.x}
              cy={c.y}
              r={active === i ? dotR + 2.5 : dotR}
              fill={active === i ? "#F5F5F7" : "#A78BFA"}
              stroke="#15151A"
              strokeWidth="2"
              className="cp-dot"
              style={{ animationDelay: `${0.25 + (i / Math.max(1, n - 1)) * 0.6}s` }}
            />
          ))}
          {ac && <circle cx={ac.x} cy={ac.y} r={dotR + 9} fill="#8B5CF6" fillOpacity="0.18" />}
        </svg>
      )}

      {a && ac && (
        <div
          className="pointer-events-none absolute z-10 w-[220px] rounded-xl border border-base-border bg-[#0d0d11]/95 p-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur"
          style={{ left: tipLeft, top: tipTop }}
          role="status"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums text-ink-primary">{a.score}</span>
            <span className="text-[11px] text-ink-muted">creative score · one analysis</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-secondary">{a.name}</p>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            {a.format}
            {a.platform ? ` · ${a.platform}` : ""} · {formatFull(a.t)}
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreList({ points }: { points: ScorePoint[] }) {
  const rows = [...points].reverse();
  return (
    <div className="cp-swap mt-3 max-h-[220px] overflow-y-auto pr-1">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-base-card text-ink-muted">
          <tr>
            <th className="py-2 pr-3 font-medium">Analyzed</th>
            <th className="py-2 pr-3 font-medium">Creative</th>
            <th className="py-2 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-border">
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap py-2 pr-3 text-ink-muted">{formatFull(p.t)}</td>
              <td className="max-w-0 py-2 pr-3">
                <Link href={`/my-creatives/${p.id}`} className="block truncate text-ink-secondary hover:text-ink-primary">
                  {p.name}
                </Link>
              </td>
              <td className="py-2 text-right font-medium tabular-nums text-ink-primary">{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="mt-3 h-[220px] animate-pulse" aria-busy="true" aria-label="Loading score history">
      <div className="flex h-full flex-col justify-between py-3">
        {Y_TICKS.map((t) => (
          <div key={t} className="h-px w-full bg-base-border/60" />
        ))}
      </div>
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */

/** Monotone cubic (Fritsch–Carlson): smooth, but never overshoots a real score. */
function monotonePath(p: { x: number; y: number }[]): string {
  const n = p.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(p[i + 1].x - p[i].x);
    m.push((p[i + 1].y - p[i].y) / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${p[i].x + h} ${p[i].y + t[i] * h} ${p[i + 1].x - h} ${p[i + 1].y - t[i + 1] * h} ${p[i + 1].x} ${p[i + 1].y}`;
  }
  return d;
}

function formatTick(t: number, range: PerformanceRange): string {
  const d = new Date(t);
  if (range === "1D") return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (range === "30D") return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function formatFull(t: number): string {
  return new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Evenly spaced axis labels that fit the width; repeated labels (same day on 30D) are dropped. */
function pickLabels(points: ScorePoint[], range: PerformanceRange, plotW: number) {
  const n = points.length;
  if (n === 0 || plotW <= 0) return [];
  const per = range === "3D" || range === "7D" ? 96 : 70;
  const max = Math.max(1, Math.min(n, Math.floor(plotW / per)));
  const idx = max === 1 ? [n === 1 ? 0 : n - 1] : Array.from(new Set(Array.from({ length: max }, (_, k) => Math.round((k * (n - 1)) / (max - 1)))));
  const out: { i: number; text: string; anchor: "start" | "middle" | "end" }[] = [];
  let last = "";
  for (const i of idx) {
    const text = formatTick(points[i].t, range);
    if (text === last) continue;
    last = text;
    out.push({ i, text, anchor: n === 1 ? "middle" : i === 0 ? "start" : i === n - 1 ? "end" : "middle" });
  }
  return out;
}
