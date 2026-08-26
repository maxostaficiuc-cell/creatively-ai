"use client";

import { useEffect, useState } from "react";
import { Check, ScanLine, Loader2 } from "lucide-react";

const STEPS = [
  "Scanning visual hierarchy…",
  "Analyzing hook strength…",
  "Evaluating scroll-stop potential…",
  "Analyzing messaging…",
  "Evaluating CTA…",
  "Analyzing audience fit…",
  "Checking creative fatigue signals…",
  "Generating recommendations…",
];

/**
 * Checklist-style analysis sequence — each step appears, then gets a
 * checkmark once "done," while a real analysis request runs in parallel.
 * If the real request finishes before the sequence does, the remaining
 * steps fast-forward rather than making the user wait on an animation.
 * If it's slower, the last step just shows a spinner instead of looking
 * stuck.
 */
export function AnalysisSequence({
  imageUrl,
  done = false,
}: {
  imageUrl?: string | null;
  done?: boolean;
}) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (completedCount >= STEPS.length) return;
    const delay = done ? 120 : 450; // fast-forward once the real result is back
    const t = setTimeout(() => setCompletedCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [completedCount, done]);

  const progress = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-lg">
      {imageUrl && (
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-base-border bg-black">
          <img src={imageUrl} alt="" className="max-h-72 w-full object-contain opacity-80" />
          <div
            className="animate-scan-beam pointer-events-none absolute left-0 right-0 h-[2px]"
            style={{
              background: "linear-gradient(90deg, transparent, #8B5CF6, transparent)",
              boxShadow: "0 0 12px 2px rgba(139,92,246,0.6)",
            }}
          />
        </div>
      )}

      <p className="mb-4 text-center text-sm font-medium uppercase tracking-wide text-ink-muted">
        Analyzing your creative
      </p>

      <div className="space-y-2.5">
        {STEPS.map((step, i) => {
          const isDone = i < completedCount;
          const isActive = i === completedCount;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-opacity duration-300 ${
                isDone || isActive ? "opacity-100" : "opacity-30"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  isDone
                    ? "border-accent-green/50 bg-accent-green/10 text-accent-green"
                    : isActive
                    ? "border-brand/50 text-brand-light"
                    : "border-base-border text-ink-muted"
                }`}
              >
                {isDone ? <Check size={12} /> : isActive ? <Loader2 size={11} className="animate-spin" /> : null}
              </span>
              <span className={isDone ? "text-ink-secondary" : isActive ? "text-ink-primary" : "text-ink-muted"}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <ScanLine size={14} className="text-brand-light" />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent-green transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-xs text-ink-secondary">{progress}%</span>
      </div>
    </div>
  );
}
