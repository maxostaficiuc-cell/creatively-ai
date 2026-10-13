"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";

// Before → After comparison for the homepage. Visual-first: the only labels
// are BEFORE and AFTER. Both ads are drawn in code (one fictional campaign,
// "Lumé Hydra Serum"), so they stay sharp at any size and load nothing extra.
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

/* ── The ads ─────────────────────────────────────────────────────────────── */

function Bottle({ className = "", tone = "plain" }: { className?: string; tone?: "plain" | "hero" }) {
  const id = tone === "hero" ? "h" : "p";
  return (
    <svg className={className} viewBox="0 0 120 260" aria-hidden>
      <defs>
        <linearGradient id={`bb-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={tone === "hero" ? "#E9E3FF" : "#E8E3DA"} />
          <stop offset="0.35" stopColor="#FFFFFF" />
          <stop offset="0.7" stopColor={tone === "hero" ? "#F3EFFF" : "#F4F1EB"} />
          <stop offset="1" stopColor={tone === "hero" ? "#C9BCF5" : "#D6D0C5"} />
        </linearGradient>
        <linearGradient id={`bp-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={tone === "hero" ? "#5B3FC4" : "#CFC9BE"} />
          <stop offset="0.45" stopColor={tone === "hero" ? "#8B6CFF" : "#F7F5F0"} />
          <stop offset="1" stopColor={tone === "hero" ? "#4C2FB0" : "#C7C0B4"} />
        </linearGradient>
      </defs>
      {/* pump */}
      <rect x="44" y="8" width="44" height="14" rx="4" fill={`url(#bp-${id})`} />
      <rect x="54" y="20" width="16" height="22" rx="3" fill={`url(#bp-${id})`} />
      <rect x="40" y="40" width="40" height="22" rx="5" fill={`url(#bp-${id})`} />
      {/* body */}
      <path d="M26 74 Q26 62 38 62 H82 Q94 62 94 74 V236 Q94 252 78 252 H42 Q26 252 26 236 Z" fill={`url(#bb-${id})`} />
      <path d="M36 80 V226" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
      {/* label */}
      <text x="60" y="150" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="3" fill={tone === "hero" ? "#3B2491" : "#7A7468"}>
        LUMÉ
      </text>
      <text x="60" y="166" textAnchor="middle" fontSize="6.5" letterSpacing="1.4" fill={tone === "hero" ? "#6B54C9" : "#9C968A"}>
        HYDRA SERUM
      </text>
      <rect x="44" y="176" width="32" height="1" fill={tone === "hero" ? "#8B6CFF" : "#B8B1A5"} />
    </svg>
  );
}

function BeforeAd() {
  return (
    <div className="ad ad-before" role="img" aria-label="Before: a plain serum ad with a vague headline, an unclear offer and a small 'Learn more' link">
      <p className="adb-brand">LUMÉ</p>
      <div className="adb-flag adb-f1">
        <p className="adb-head">Introducing our new serum</p>
        <Marker n={1} text="Weak hook" />
      </div>
      <div className="adb-flag adb-f2">
        <p className="adb-copy">Now available. Limited-time offer on selected items.</p>
        <Marker n={2} text="Unclear offer" />
      </div>
      <Bottle className="adb-bottle" />
      <div className="adb-shadow" />
      <div className="adb-flag adb-f3">
        <p className="adb-cta">Learn more</p>
        <Marker n={3} text="Easy to miss" />
      </div>
    </div>
  );
}

function Marker({ n, text }: { n: number; text: string }) {
  return (
    <span className="adb-marker" style={{ ["--n" as string]: n }}>
      <span className="adb-num">{n}</span>
      {text}
    </span>
  );
}

function AfterAd() {
  return (
    <div className="ad ad-after" role="img" aria-label="After: the same serum ad with a clear 'Glow in 7 days' headline, a 20% first-order offer and a bold 'Shop the serum' button">
      <div className="ada-glow" />
      <p className="ada-brand">LUMÉ</p>
      <p className="ada-head">Glow in 7&nbsp;days.</p>
      <p className="ada-sub">Hydra Serum · 2% hyaluronic acid</p>
      <span className="ada-offer">20% off your first order</span>
      <div className="ada-stage">
        <span className="ada-podium" />
        <Bottle className="ada-bottle" tone="hero" />
      </div>
      <span className="ada-cta">Shop the serum →</span>
      <span className="ada-chip ada-c1" style={{ ["--n" as string]: 1 }}>
        <Check size={10} strokeWidth={3} /> Clear hook
      </span>
      <span className="ada-chip ada-c2" style={{ ["--n" as string]: 2 }}>
        <Check size={10} strokeWidth={3} /> Offer up front
      </span>
      <span className="ada-chip ada-c3" style={{ ["--n" as string]: 3 }}>
        <Check size={10} strokeWidth={3} /> CTA stands out
      </span>
    </div>
  );
}
