"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  computeScoreTrend,
  trendChangePercent,
  type PerformancePeriod,
} from "@/lib/creativePerformanceTrend";
import type { Creative } from "@/lib/types";

const PERIODS: PerformancePeriod[] = ["30D", "60D", "90D"];
const WIDTH = 600;
const HEIGHT = 180;
const PADDING = 16;

export function CreativePerformanceChart({ creatives }: { creatives: Creative[] }) {
  const [period, setPeriod] = useState<PerformancePeriod>("30D");
  const ref = useRef<HTMLDivElement>(null);
  const [drawKey, setDrawKey] = useState(0); // bumping this replays the draw animation
  const [hasEntered, setHasEntered] = useState(false);

  const points = useMemo(() => computeScoreTrend(creatives, period), [creatives, period]);
  const change = points ? trendChangePercent(points) : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasEntered) {
          setHasEntered(true);
          setDrawKey((k) => k + 1);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replay the draw-in animation whenever the user switches periods, once
  // the chart has already appeared for the first time.
  useEffect(() => {
    if (hasEntered) setDrawKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-ink-primary">Creative Performance</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            How your creative quality has changed over time.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-base-border bg-base-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                period === p ? "bg-base-surface text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-base-border bg-base-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Creative Score Over Time</p>

        {!points ? (
          <div className="flex h-40 items-center justify-center text-sm text-ink-secondary">
            Not enough data yet for this period.
          </div>
        ) : (
          <ChartSvg key={drawKey} points={points} />
        )}

        {change !== null && (
          <div className="mt-4 flex items-center gap-2 border-t border-base-border pt-4">
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                change >= 0 ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {change >= 0 ? "+" : ""}
              {change}%
            </span>
            <span className="text-xs text-ink-muted">Average creative score</span>
            <span className="ml-auto text-xs text-ink-secondary">
              Your average creative score has {change >= 0 ? "improved" : "declined"} {Math.abs(change)}%
              over the last {period === "30D" ? "30" : period === "60D" ? "60" : "90"} days.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartSvg({ points }: { points: { label: string; score: number | null }[] }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const usableWidth = WIDTH - PADDING * 2;
  const usableHeight = HEIGHT - PADDING * 2;
  const stepX = usableWidth / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: PADDING + i * stepX,
    y: p.score === null ? null : PADDING + usableHeight - (p.score / 100) * usableHeight,
    score: p.score,
    label: p.label,
  }));

  // Only draw segments between consecutive real points — never invent a
  // value for a gap.
  const segments: string[] = [];
  let current: string | null = null;
  for (const c of coords) {
    if (c.y === null) {
      current = null;
      continue;
    }
    if (current === null) {
      current = `M ${c.x} ${c.y}`;
      segments.push(current);
    } else {
      segments[segments.length - 1] += ` L ${c.x} ${c.y}`;
    }
  }
  const pathData = segments.join(" ");

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const length = el.getTotalLength();
    setPathLength(length);
    if (reduceMotion) {
      setDrawn(true);
      return;
    }
    // Force a reflow so the initial dash-offset is applied before
    // transitioning, or the browser may skip straight to the end state.
    el.style.transition = "none";
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.strokeDashoffset = "0";
    setTimeout(() => setDrawn(true), 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathData]);

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        {/* subtle grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={PADDING + usableHeight * f}
            y2={PADDING + usableHeight * f}
            stroke="#242429"
            strokeWidth="1"
          />
        ))}
        <defs>
          <linearGradient id="perfLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        {pathData && (
          <path
            ref={pathRef}
            d={pathData}
            fill="none"
            stroke="url(#perfLineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: drawn ? "drop-shadow(0 0 6px rgba(139,92,246,0.5))" : "none",
              transition: "filter 0.6s ease-out",
            }}
          />
        )}
        {coords.map(
          (c, i) =>
            c.y !== null && (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r="3"
                fill="#A78BFA"
                style={{
                  opacity: drawn || reduceMotion ? 1 : 0,
                  transition: `opacity 0.3s ease-out ${(i / Math.max(1, coords.length - 1)) * 1.2}s`,
                }}
              />
            )
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
