"use client";

import { useEffect } from "react";

/**
 * One IntersectionObserver for the whole homepage: any element with
 * `data-reveal` fades and rises in the first time it enters the viewport
 * (stagger via the `--d` custom property). Bars marked `data-reveal-bar`
 * grow from zero, and `data-reveal-sweep` adds a single light sweep.
 *
 * Content is only hidden after this runs (the `reveal-ready` class on <html>),
 * so without JavaScript — or with reduced motion — everything is visible.
 */
export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    // Pricing cards live in a shared component (also used on /pricing), so they
    // are tagged here instead of editing that component.
    document.querySelectorAll<HTMLElement>("#pricing .grid > div").forEach((el, i) => {
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--d", String(i));
    });

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    // Anything already on screen (or above it) is shown immediately — no flash.
    const vh = window.innerHeight;
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add("is-revealed");
    });
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    targets.forEach((el) => !el.classList.contains("is-revealed") && io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
