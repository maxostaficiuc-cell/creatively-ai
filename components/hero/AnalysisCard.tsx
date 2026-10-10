"use client";

import { forwardRef, useId, useState } from "react";
import { Check, X, Sparkles, ChevronDown } from "lucide-react";
import type { AnalysisCardData, AnalysisTone } from "@/lib/demoCreative";

export const TONE: Record<AnalysisTone, { rgb: string; text: string; icon: typeof Check; srLabel: string }> = {
  green: { rgb: "34,197,94", text: "text-[#4ADE80]", icon: Check, srLabel: "Strengths" },
  red: { rgb: "239,68,68", text: "text-[#F87171]", icon: X, srLabel: "Weaknesses" },
  purple: { rgb: "167,139,250", text: "text-[#C4B5FD]", icon: Sparkles, srLabel: "Recommendations" },
};

/**
 * Glass panel for one analysis category. Pure presentation — the hero
 * sequences position and animate it from the outside via `className`/`style`.
 *
 * - variant "full":    label + one-sentence explanation for every finding (desktop).
 * - variant "compact": labels only, with an accessible "Show details" toggle
 *                      that reveals the same explanations (mobile).
 */
export const AnalysisCard = forwardRef<
  HTMLDivElement,
  {
    card: AnalysisCardData;
    variant?: "full" | "compact";
    className?: string;
    style?: React.CSSProperties;
  }
>(function AnalysisCard({ card, variant = "full", className, style }, ref) {
  const tone = TONE[card.tone];
  const Icon = tone.icon;
  const [open, setOpen] = useState(false);
  const listId = useId();
  const compact = variant === "compact";
  const showDetail = !compact || open;

  return (
    <div
      ref={ref}
      className={`${className?.includes("absolute") ? "" : "relative"} overflow-hidden rounded-[18px] ${className || ""}`}
      style={{
        background: "linear-gradient(180deg, rgba(22,22,28,0.80) 0%, rgba(12,12,16,0.86) 100%)",
        border: `1px solid rgba(${tone.rgb},0.28)`,
        boxShadow: `0 24px 48px -20px rgba(0,0,0,0.7), 0 0 36px -14px rgba(${tone.rgb},0.42), inset 0 1px 0 rgba(255,255,255,0.06)`,
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        ...style,
      }}
    >
      {/* illuminated top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${tone.rgb},0.7), transparent)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${tone.rgb},0.15), transparent 70%)` }}
      />

      <div className={`hero-card-body relative ${compact ? "px-4 pb-3.5 pt-3.5" : "px-5 pb-[18px] pt-[18px]"}`}>
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={`flex shrink-0 items-center justify-center rounded-full ${tone.text} ${compact ? "h-6 w-6" : "h-7 w-7"}`}
            style={{
              background: `rgba(${tone.rgb},0.12)`,
              boxShadow: `inset 0 0 0 1px rgba(${tone.rgb},0.35), 0 0 16px -4px rgba(${tone.rgb},0.7)`,
            }}
          >
            <Icon size={compact ? 12 : 14} strokeWidth={2.5} />
          </span>
          <h3 className={`font-semibold uppercase tracking-[0.14em] ${tone.text} ${compact ? "text-[11px]" : "text-[12px]"}`}>
            <span className="sr-only">{tone.srLabel}: </span>
            {card.title}
          </h3>
        </div>

        <ul id={listId} className={`hero-card-list ${compact ? "mt-3 space-y-1.5" : "mt-3.5 space-y-2.5"}`}>
          {card.findings.map((f) => (
            <li key={f.label} className="hero-card-item flex gap-2.5">
              <span
                aria-hidden
                className={`h-1 w-1 shrink-0 rounded-full ${compact ? "mt-[8px]" : "mt-[6px]"}`}
                style={{ background: `rgb(${tone.rgb})`, boxShadow: `0 0 6px rgba(${tone.rgb},0.9)` }}
              />
              <span className="min-w-0">
                <span
                  className={`hero-card-label block font-medium text-white ${compact ? "text-[13px] leading-[1.45]" : "text-[12.5px] leading-[1.3]"}`}
                >
                  {f.label}
                </span>
                {showDetail && (
                  <span
                    className={`hero-card-detail mt-0.5 block text-white/[0.62] ${compact ? "text-[12.5px] leading-[1.45]" : "text-[11.5px] leading-[1.4]"}`}
                  >
                    {f.detail}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {compact && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={listId}
            className={`mt-3 inline-flex items-center gap-1 rounded-md text-[11.5px] font-medium ${tone.text} opacity-90 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/40`}
          >
            {open ? "Hide details" : "Show details"}
            <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
});
