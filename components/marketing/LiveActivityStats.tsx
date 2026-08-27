"use client";

import { useEffect, useRef, useState } from "react";

type Stats = { creativesAnalyzed: number; creditsProcessed: number; configured: boolean };

/**
 * Real platform activity, pulled from the actual database — not scripted
 * fake increments. Numbers count up once when the section scrolls into
 * view, then quietly refresh from the real API every couple of minutes
 * while the tab stays open, so a long-open tab shows genuinely updated
 * numbers if real usage happens meanwhile. No fabricated growth.
 */
export function LiveActivityStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  async function fetchStats() {
    try {
      const res = await fetch("/api/public-stats");
      const data = await res.json();
      setStats(data);
    } catch {
      // Leave stats as-is on a transient failure — no fake fallback.
    }
  }

  useEffect(() => {
    fetchStats();
    // A quiet real-data refresh, not a fake incrementing timer. Cleared on
    // unmount so there's never more than one interval alive.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchStats();
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || !stats.configured) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-base-border bg-base-card px-8 py-10 shadow-glow">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Live Activity</span>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <StatBlock value={stats.creativesAnalyzed} label="Creatives analyzed" />
          <StatBlock value={stats.creditsProcessed} label="AI credits processed" />
        </div>
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          animateTo(value);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // A real refetch changed the number after the initial reveal — animate
    // the delta smoothly rather than jump-cutting to the new value.
    if (started.current && value !== prevValue.current) {
      animateTo(value);
    }
  }, [value]);

  function animateTo(target: number) {
    const from = prevValue.current;
    prevValue.current = target;
    const duration = 900;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (target - from) * progress));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return (
    <div ref={ref} className="text-center transition-all duration-500">
      <p className="text-4xl font-bold text-ink-primary sm:text-5xl">{display.toLocaleString()}</p>
      <p className="mt-1.5 text-sm text-ink-secondary">{label}</p>
    </div>
  );
}
