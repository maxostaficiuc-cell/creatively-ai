"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

// Before → After comparison for the homepage. Visual-first: the only labels
// are BEFORE and AFTER. The two ads are supplied images (public/before-after):
// the cluttered Huel Daily Greens mockup (BEFORE) and the original minimalist
// Huel Daily Greens ad (AFTER). Both are 9:16 portrait and shown uncropped.
//
// Plays once each time the section comes into view (it replays if you scroll
// away and come back, never while it stays visible). Reduced motion shows
// the finished state.

export function BeforeAfter() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [roas, setRoas] = useState(3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    el.dataset.armed = ""; // only now hide things, so no-JS visitors see everything
    setRoas(1);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.3) setInView(true);
        else if (!e.isIntersecting) setInView(false); // fully gone: allow a replay next time
      },
      { threshold: [0, 0.3] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 1.0× → 3× count-up, after the After card has revealed.
  useEffect(() => {
    const el = ref.current;
    if (!el || !("armed" in el.dataset)) return; // static mode: stays at 3×
    if (!inView) {
      setRoas(1);
      return;
    }
    let raf = 0;
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 900);
        setRoas(1 + 2 * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 1550);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [inView]);

  return (
    <section ref={ref} aria-label="Before and after example" className="ba-section" data-in={inView ? "" : undefined}>
      <div aria-hidden className="ba-ambient" />
      <div className="ba-grid">
        {/* BEFORE */}
        <figure className="ba-card ba-before">
          <figcaption className="ba-label">Before</figcaption>
          <div className="ba-frame">
            <BeforeAd />
          </div>
        </figure>

        {/* connector */}
        <div aria-hidden className="ba-link">
          <svg className="ba-link-h" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0 5 H100" pathLength={1} />
          </svg>
          <svg className="ba-link-v" viewBox="0 0 10 100" preserveAspectRatio="none">
            <path d="M5 0 V100" pathLength={1} />
          </svg>
          <span className="ba-link-dot" />
          <span className="ba-node">
            <Sparkles size={16} />
          </span>
        </div>

        {/* AFTER */}
        <figure className="ba-card ba-after">
          <figcaption className="ba-label ba-label-after">After</figcaption>
          <div className="ba-frame ba-frame-after">
            <AfterAd />
            <span aria-hidden className="ba-sweep" />
          </div>
          <div className="ba-result" role="note">
            <p className="ba-roas">
              <span className="tabular-nums">{roas >= 2.995 ? "3" : roas.toFixed(1)}</span>× <span className="ba-roas-unit">ROAS</span>
            </p>
            <p className="ba-result-sub">More likely to perform well</p>
            <p className="ba-result-note">Illustrative example — results vary.</p>
          </div>
        </figure>
      </div>
    </section>
  );
}

/* ── The ads (supplied images, shown whole) ─────────────────────────────── */

function BeforeAd() {
  return (
    <picture>
      <source type="image/webp" srcSet="/before-after/huel-before.webp" />
      <img
        className="ad ad-before"
        src="/before-after/huel-before.jpg"
        alt="Before: an illustrative, cluttered version of the Huel Daily Greens ad, covered in stickers, arrows and emojis"
        width={720}
        height={1281}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}

function AfterAd() {
  return (
    <picture>
      <source type="image/webp" srcSet="/before-after/huel-after.webp" />
      <img
        className="ad ad-after"
        src="/before-after/huel-after.png"
        alt="After: the original minimalist Huel Daily Greens ad — '166 health benefits, 1 serving', a hand holding the bottle, 30 servings for 1.83 € per serve"
        width={338}
        height={600}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
