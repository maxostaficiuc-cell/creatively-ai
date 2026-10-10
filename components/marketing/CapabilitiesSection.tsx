"use client";

import { useEffect, useRef } from "react";
import { ScanSearch, LayoutGrid, FlaskConical } from "lucide-react";

const capabilities = [
  {
    icon: ScanSearch,
    title: "Creative intelligence",
    body: "Understand your hook, visuals, copy, offer, CTA, and messaging.",
  },
  {
    icon: LayoutGrid,
    title: "Winning ads",
    body: "Discover advertising inspiration organized by industry, niche, platform, and format.",
  },
  {
    icon: FlaskConical,
    title: "Actionable recommendations",
    body: "Turn creative observations into specific testing hypotheses.",
  },
];

/** "Your ads have potential" — the section the hero hands off to. */
export function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(".hero-reveal") ?? []);
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="how-it-works" className="relative scroll-mt-24 bg-[#08080B] px-6 py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(139,92,246,0.10), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl">
        <h2 className="hero-reveal mx-auto max-w-4xl text-center text-[clamp(28px,4.2vw,52px)] font-semibold uppercase leading-[1.05] tracking-[-0.02em] text-white">
          Your ads have potential.
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-[#C4B5FD] to-[#8B5CF6] bg-clip-text text-transparent">
            Find out how to unlock it.
          </span>
        </h2>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {capabilities.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="hero-reveal group relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition-colors duration-300 hover:border-brand/30"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/40 to-transparent"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-light ring-1 ring-inset ring-brand/25">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-white">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#9A9AA5]">{c.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
