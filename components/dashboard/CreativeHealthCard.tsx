"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import type { CreativeHealthData } from "@/lib/creativeHealth";

const METRICS: { key: keyof CreativeHealthData["signals"]; label: string; lowerIsBetter?: boolean }[] = [
  { key: "hookStrength", label: "Hook Strength" },
  { key: "visualAttention", label: "Visual Attention" },
  { key: "messageClarity", label: "Message Clarity" },
  { key: "ctaStrength", label: "CTA Strength" },
  { key: "audienceMatch", label: "Audience Match" },
  { key: "fatigueRisk", label: "Fatigue Risk", lowerIsBetter: true },
];

export function CreativeHealthCard({ health }: { health: CreativeHealthData | null }) {
  if (!health) {
    return (
      <div className="rounded-2xl border border-base-border bg-base-card p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Creative Health</p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-secondary">
          Analyze your first creative to see your Creative Health score.
        </p>
        <ButtonLink href="/analyze" className="mt-4">
          Analyze a Creative <Sparkles size={14} />
        </ButtonLink>
      </div>
    );
  }

  return <CreativeHealthContent health={health} />;
}

function CreativeHealthContent({ health }: { health: CreativeHealthData }) {
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [progress, setProgress] = useState(0); // 0-1, drives every number + bar in sync

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          function tick(now: number) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setProgress(eased);
            if (t < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayScore = Math.round(health.score * progress);
  const isPositive = (health.change ?? 0) >= 0;

  return (
    <div ref={ref} className="rounded-2xl border border-brand/40 bg-base-card p-6 shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Creative Health</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink-primary">{displayScore}</span>
            <span className="text-sm text-ink-muted">/ 100</span>
          </div>
          <p className="mt-1 text-xs text-ink-secondary">Overall creative performance</p>
        </div>
        {health.change !== null && (
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isPositive ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? "+" : ""}
            {health.change}% vs last 30 days
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-x-8 gap-y-4 border-t border-base-border pt-5 sm:grid-cols-2">
        {METRICS.map((m) => {
          const finalValue = health.signals[m.key];
          const value = Math.round(finalValue * progress);
          return (
            <div key={m.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-secondary">
                  {m.label}
                  {m.lowerIsBetter && <span className="ml-1.5 text-[10px] text-ink-muted">(lower is better)</span>}
                </span>
                <span className="text-ink-primary">{value} / 100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-border">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${
                    m.lowerIsBetter ? "from-orange-400 to-orange-300" : "from-brand to-brand-light"
                  }`}
                  style={{ width: `${finalValue * progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
