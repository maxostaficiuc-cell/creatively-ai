import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { GetFreeReportButton } from "@/components/marketing/GetFreeReportButton";

/** Headline, supporting copy and the two hero CTAs. */
export const HeroHeadline = forwardRef<HTMLDivElement, { className?: string; style?: React.CSSProperties }>(
  function HeroHeadline({ className, style }, ref) {
    return (
      <div ref={ref} className={`mx-auto max-w-[1080px] px-6 text-center ${className || ""}`} style={style}>
        <p className="animate-fade-in-up text-[10px] font-medium uppercase tracking-[0.2em] min-[360px]:tracking-[0.24em] text-brand-light/90 sm:text-[11px] sm:tracking-[0.28em]">
          AI creative analysis for advertisers
        </p>
        <h1
          className="mx-auto mt-4 max-w-[19ch] animate-fade-in-up text-balance text-[clamp(27px,8vw,42px)] font-semibold uppercase leading-[1.04] tracking-[-0.02em] text-white sm:mt-5 sm:max-w-none sm:text-[clamp(40px,5.2vw,72px)] sm:leading-[1.02] sm:tracking-[-0.025em]"
          style={{ animationDelay: "60ms" }}
        >
          Know what&apos;s wrong with your ad{" "}
          <span className="bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
            before you spend money on it.
          </span>
        </h1>
        <p
          className="mx-auto mt-4 max-w-[330px] animate-fade-in-up text-pretty text-[15px] leading-relaxed text-[#9A9AA5] sm:mt-6 sm:max-w-[560px] sm:text-[clamp(15px,1.25vw,18px)]"
          style={{ animationDelay: "120ms" }}
        >
          Upload your ad and discover what&apos;s working, what&apos;s holding it back, and exactly what to test next.
        </p>
        <div
          className="mx-auto mt-6 flex max-w-[360px] animate-fade-in-up flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center sm:gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <GetFreeReportButton className="w-full px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 sm:w-auto">
            Get your free report <ArrowRight size={15} />
          </GetFreeReportButton>
          <ButtonLink
            href="#winning-ads"
            variant="secondary"
            className="w-full border-white/10 bg-white/[0.04] px-7 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 sm:w-auto sm:py-3.5 sm:text-[13px]"
          >
            Explore winning ads
          </ButtonLink>
        </div>
      </div>
    );
  }
);
