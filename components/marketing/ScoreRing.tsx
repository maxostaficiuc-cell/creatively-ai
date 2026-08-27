"use client";

import { useEffect, useRef, useState } from "react";

export function ScoreRing({
  score,
  label,
  size = 128,
  showLabel = true,
}: {
  score: number;
  label?: string;
  size?: number;
  showLabel?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500; // 1.2–1.8s range, ring and number driven by the same state
          const start = performance.now();
          function tick(now: number) {
            const progress = Math.min(1, (now - start) / duration);
            // Ease-out — starts fast, settles gently into the final value.
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * score));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Genuinely starts at 0 (full circumference offset = empty ring) and
  // animates toward the final offset as `display` climbs — the ring and
  // the number are driven by the exact same state, so they always finish
  // together.
  const offset = circumference - (display / 100) * circumference;
  const numberSize = Math.max(11, Math.round(size * 0.23));

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#242429" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-ink-primary" style={{ fontSize: numberSize }}>
            {display}
          </span>
          {showLabel && <span className="text-xs text-ink-muted">/100</span>}
        </div>
      </div>
      {showLabel && label && (
        <span className="mt-3 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-light">
          {label}
        </span>
      )}
    </div>
  );
}
