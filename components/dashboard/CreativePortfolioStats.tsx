"use client";

import { useEffect, useRef, useState } from "react";
import { FileImage, Target, TrendingUp, AlertCircle } from "lucide-react";

export type PortfolioStats = {
  creativesAnalyzed: number;
  averageScore: number | null;
  winningCreatives: number;
  needsImprovement: number;
};

const CARDS = [
  { key: "creativesAnalyzed" as const, label: "Creatives Analyzed", icon: FileImage },
  { key: "averageScore" as const, label: "Average Score", icon: Target },
  { key: "winningCreatives" as const, label: "Winning Creatives", icon: TrendingUp },
  { key: "needsImprovement" as const, label: "Need Improvement", icon: AlertCircle },
];

export function CreativePortfolioStats({ stats }: { stats: PortfolioStats }) {
  return (
    <div>
      <h2 className="font-medium text-ink-primary">Creative Portfolio</h2>
      <p className="mt-1 text-sm text-ink-secondary">A snapshot of your creative performance.</p>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map((c, i) => (
          <StatCard
            key={c.key}
            icon={c.icon}
            label={c.label}
            value={stats[c.key]}
            delay={i * 80}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: typeof FileImage;
  label: string;
  value: number | null;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const t0 = setTimeout(() => {
            setVisible(true);
            if (reduceMotion || value === null) {
              setDisplay(value ?? 0);
              return;
            }
            const duration = 900;
            const start = performance.now();
            function tick(now: number) {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setDisplay(Math.round(eased * (value ?? 0)));
              if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }, delay);
          return () => clearTimeout(t0);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={`group rounded-2xl border border-base-border bg-base-card p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand/30 hover:shadow-glow ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <Icon size={16} className="text-brand-light opacity-70" />
      <p className="mt-3 text-2xl font-bold text-ink-primary sm:text-3xl">
        {value === null ? "—" : display}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </div>
  );
}
