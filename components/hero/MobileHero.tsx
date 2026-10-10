"use client";

import { useEffect, useRef } from "react";
import { HandPhoto, PhoneScreenLayer } from "@/components/hero/HandPhone";
import { AnalysisCard } from "@/components/hero/AnalysisCard";
import { HeroHeadline } from "@/components/hero/HeroHeadline";
import { HeroAmbient } from "@/components/hero/HeroAmbient";
import { HERO_DISCLAIMER, handPhoneCssVars, heroAnalysis } from "@/lib/heroDemo";

/**
 * Phones and tablets (< 1024px): no pinning. The hand and phone rise in on
 * load, then the three cards stack vertically and fade up as they scroll into
 * view. Same data, same components, simpler motion.
 */
export function MobileHero({ reduced }: { reduced: boolean }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>(".hero-reveal") ?? []);
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section
      id="top-mobile"
      aria-label="Creatively.ai — example ad analysis"
      className="relative overflow-hidden bg-[#08080B] pb-20 pt-28 lg:hidden"
    >
      <HeroAmbient />

      <HeroHeadline className="relative z-10" />

      {/* hand + phone: the photo is cropped at the wrist and fades into the page */}
      <div
        className="relative mt-10 w-full overflow-hidden"
        style={{
          // photo is rendered wider than the screen so the phone itself reads large; crop at the wrist
          ...(handPhoneCssVars() as React.CSSProperties),
          // phone display ~63% of the screen width; show the photo down to just past the wrist
          ["--m-photo-w" as string]: "calc(min(63vw, 290px) / var(--scr-w))",
          height: "calc(var(--m-photo-w) / var(--hp-aspect) * (var(--scr-top) + var(--scr-h) + 0.14))",
          WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
        }}
      >
        {/* backdrop inside the masked group so the photo's black blends into page colour + halo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[#08080B]"
          style={{ backgroundImage: "radial-gradient(circle at 50% 42%, rgba(124,58,237,0.24), transparent 58%)" }}
        />
        <div
          className={`absolute top-0 mix-blend-lighten ${reduced ? "" : "hero-rise"}`}
          style={{ width: "var(--m-photo-w)", left: "calc(50% - var(--m-photo-w) / 2)" }}
        >
          <HandPhoto className="w-full" />
        </div>
        <div
          className={`absolute top-0 ${reduced ? "" : "hero-rise"}`}
          style={{ width: "var(--m-photo-w)", left: "calc(50% - var(--m-photo-w) / 2)" }}
        >
          <PhoneScreenLayer className="w-full" />
        </div>
      </div>

      <div ref={listRef} className="relative z-10 mx-auto -mt-10 flex max-w-[460px] flex-col gap-4 px-5">
        {heroAnalysis.map((card, i) => (
          <div key={card.id} className="hero-reveal" style={{ transitionDelay: `${i * 60}ms` }}>
            <AnalysisCard card={card} compact />
          </div>
        ))}
        <p className="hero-reveal px-1 text-center text-[11px] leading-snug text-white/40">{HERO_DISCLAIMER}</p>
      </div>
    </section>
  );
}
