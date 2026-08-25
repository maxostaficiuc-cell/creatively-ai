"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";

const STEPS = [
  "Uploading creative…",
  "Reading visual hierarchy…",
  "Analyzing the hook…",
  "Evaluating message clarity…",
  "Checking offer strength…",
  "Analyzing CTA…",
  "Evaluating scroll-stop potential…",
  "Identifying audience signals…",
  "Finding creative strengths…",
  "Finding performance risks…",
  "Generating recommendations…",
  "Building your creative report…",
];

/**
 * Cinematic step-through sequence shown while a real analysis request is
 * in flight. Cycles through the labels above; loops the last one if the
 * real request is slower than the sequence, so it never looks stuck.
 */
export function AnalysisSequence({ imageUrl }: { imageUrl?: string | null }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 550);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-base-border bg-base-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand/40 text-brand-light">
          <ScanLine size={16} className="animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">Analyzing your creative…</p>
          <p className="text-xs text-ink-secondary">{STEPS[stepIndex]}</p>
        </div>
      </div>

      {imageUrl && (
        <div className="relative mb-4 overflow-hidden rounded-xl border border-base-border bg-black">
          <img src={imageUrl} alt="" className="max-h-72 w-full object-contain opacity-80" />
          <div
            className="animate-scan-beam pointer-events-none absolute left-0 right-0 h-[2px]"
            style={{
              background: "linear-gradient(90deg, transparent, #22C55E, transparent)",
              boxShadow: "0 0 12px 2px rgba(34,197,94,0.6)",
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent-green transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-xs text-ink-secondary">{progress}%</span>
      </div>
    </div>
  );
}
