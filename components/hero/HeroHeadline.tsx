import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { GetFreeReportButton } from "@/components/marketing/GetFreeReportButton";

/** Headline, supporting copy and the two hero CTAs. */
export const HeroHeadline = forwardRef<HTMLDivElement, { className?: string; style?: React.CSSProperties }>(
  function HeroHeadline({ className, style }, ref) {
    return (
      <div ref={ref} className={`mx-auto max-w-[1080px] px-6 text-center ${className || ""}`} style={style}>
        <p className="animate-fade-in-up text-[11px] font-medium uppercase tracking-[0.28em] text-brand-light/90">
          AI creative analysis for advertisers
        </p>
        <h1
          className="mt-5 animate-fade-in-up text-[clamp(34px,5.2vw,72px)] font-semibold uppercase leading-[1.02] tracking-[-0.025em] text-white"
          style={{ animationDelay: "60ms", animationFillMode: "both" }}
        >
          Know what&apos;s wrong with your ad{" "}
          <span className="bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
            before you spend money on it.
          </span>
        </h1>
        <p
          className="mx-auto mt-6 max-w-[560px] animate-fade-in-up text-[clamp(15px,1.25vw,18px)] leading-relaxed text-[#9A9AA5]"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          Upload your ad and discover what&apos;s working, what&apos;s holding it back, and exactly what to test next.
        </p>
        <div
          className="mt-8 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
        >
          <GetFreeReportButton className="w-full px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] sm:w-auto">
            Get your free report <ArrowRight size={15} />
          </GetFreeReportButton>
          <ButtonLink
            href="#winning-ads"
            variant="secondary"
            className="w-full border-white/10 bg-white/[0.04] px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] backdrop-blur sm:w-auto"
          >
            Explore winning ads
          </ButtonLink>
        </div>
      </div>
    );
  }
);
