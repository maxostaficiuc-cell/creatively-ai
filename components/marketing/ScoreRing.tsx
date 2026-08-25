"use client";

import { useEffect, useRef, useState } from "react";

export function ScoreRing({ score, label }: { score: number; label: string }) {
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
          const duration = 1000;
          const start = performance.now();
          function tick(now: number) {
            const progress = Math.min(1, (now - start) / duration);
            setDisplay(Math.round(progress * score));
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
  const offset = circumference - (display / 100) * circumference;

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative h-32 w-32">
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
          <span className="text-3xl font-bold text-ink-primary">{display}</span>
          <span className="text-xs text-ink-muted">/100</span>
        </div>
      </div>
      <span className="mt-3 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-light">
        {label}
      </span>
    </div>
  );
}
