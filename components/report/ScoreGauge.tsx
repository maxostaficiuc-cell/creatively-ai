"use client";

import { useEffect, useRef, useState } from "react";

/** Colour band for a 0-100 score, matching the verdict bands. */
export function scoreColor(score: number) {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#A78BFA";
  if (score >= 40) return "#FBBF24";
  return "#F87171";
}

/**
 * 270° arc gauge. The arc and the number are driven by the same value, so
 * they always agree. Animates once when first visible; with reduced motion
 * (or no IntersectionObserver) it shows the final value immediately.
 */
export function ScoreGauge({ score, size = 168, label }: { score: number; size?: number; label?: string }) {
  const [shown, setShown] = useState(score);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setShown(score);
      return;
    }
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1300;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          setShown(Math.round((1 - Math.pow(1 - p, 3)) * score));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [score]);

  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75; // 270°
  const filled = arc * (shown / 100);
  const gid = `rp-gauge-${size}`;

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Creative score ${score} out of 100${label ? `, ${label}` : ""}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="60%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#D8B4FE" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ filter: "drop-shadow(0 0 12px rgba(139, 92, 246, 0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="text-[44px] font-semibold leading-none tracking-tight text-ink-primary tabular-nums">{shown}</span>
        <span className="mt-1 text-xs text-ink-muted">out of 100</span>
      </div>
    </div>
  );
}
