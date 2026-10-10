import { forwardRef } from "react";
import { Check, X, Sparkles } from "lucide-react";
import type { AnalysisTone, HeroAnalysisCard } from "@/lib/heroDemo";

export const TONE: Record<
  AnalysisTone,
  { rgb: string; text: string; icon: typeof Check; label: string }
> = {
  green: { rgb: "34,197,94", text: "text-[#4ADE80]", icon: Check, label: "Positive finding" },
  red: { rgb: "239,68,68", text: "text-[#F87171]", icon: X, label: "Weakness" },
  purple: { rgb: "167,139,250", text: "text-[#C4B5FD]", icon: Sparkles, label: "Recommendation" },
};

/**
 * Floating glass panel for one analysis category. Pure presentation — the
 * scroll sequence positions and animates it from the outside via `style`.
 */
export const AnalysisCard = forwardRef<
  HTMLDivElement,
  { card: HeroAnalysisCard; className?: string; style?: React.CSSProperties; compact?: boolean }
>(function AnalysisCard({ card, className, style, compact = false }, ref) {
  const tone = TONE[card.tone];
  const Icon = tone.icon;

  return (
    <div
      ref={ref}
      className={`${className?.includes("absolute") ? "" : "relative"} overflow-hidden rounded-[20px] ${className || ""}`}
      style={{
        background: "linear-gradient(180deg, rgba(22,22,28,0.78) 0%, rgba(12,12,16,0.82) 100%)",
        border: `1px solid rgba(${tone.rgb},0.28)`,
        boxShadow: `0 30px 60px -20px rgba(0,0,0,0.7), 0 0 44px -14px rgba(${tone.rgb},0.45), inset 0 1px 0 rgba(255,255,255,0.06)`,
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        ...style,
      }}
    >
      {/* illuminated top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${tone.rgb},0.7), transparent)` }}
      />
      {/* soft tinted wash in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${tone.rgb},0.16), transparent 70%)` }}
      />

      <div className={`hero-card-body relative ${compact ? "p-5" : "p-5 xl:p-6"}`}>
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${tone.text}`}
            style={{
              background: `rgba(${tone.rgb},0.12)`,
              boxShadow: `inset 0 0 0 1px rgba(${tone.rgb},0.35), 0 0 16px -4px rgba(${tone.rgb},0.7)`,
            }}
            aria-label={tone.label}
          >
            <Icon size={14} strokeWidth={2.5} />
          </span>
          <h3 className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${tone.text}`}>
            {card.title}
          </h3>
        </div>

        <ul className="hero-card-list mt-4 space-y-2.5">
          {card.items.map((item) => (
            <li key={item.lead} className="hero-card-item flex gap-2.5 text-[12.5px] leading-[1.5] text-white/70">
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                style={{ background: `rgb(${tone.rgb})`, boxShadow: `0 0 6px rgba(${tone.rgb},0.9)` }}
              />
              <span>
                <span className="font-medium text-white">{item.lead}</span>
                {item.rest}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
