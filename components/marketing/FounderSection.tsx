"use client";

/* eslint-disable @next/next/no-img-element -- art-directed <picture> with webp + jpg */

import { useEffect, useLayoutEffect, useRef } from "react";
import { ArrowUpRight, Instagram } from "lucide-react";
import { FOUNDER } from "@/lib/founder";

// "Meet the founder": a scroll-driven scene. A wine glass tilts, pours a
// violet stream into the founder card, the card's border fills with light and
// the profile is revealed. Every value is a pure function of scroll position,
// so scrolling back up plays it in reverse.
//
// Performance: one passive scroll listener, at most one rAF per frame, and the
// only thing written is a handful of CSS custom properties on the section.
// React never re-renders while scrolling.

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep

/** Glass geometry (viewBox units): pivot of the tilt and the full tilt angle. */
const PIVOT = { x: 90, y: 50 };
const MAX_TILT = 100;

/** Every animated value for a given scroll progress p ∈ [0, 1]. */
function frame(p: number) {
  const enter = ease(seg(p, 0, 0.14));
  const tilt = ease(seg(p, 0.1, 0.34));
  const pour = seg(p, 0.28, 0.46);
  const fill = ease(seg(p, 0.4, 0.66));
  const stop = seg(p, 0.62, 0.72);
  const settle = ease(seg(p, 0.7, 0.86));
  const peek = ease(seg(p, 0.32, 0.46));
  const hop = seg(p, 0.74, 0.88);
  const exit = seg(p, 0.9, 1);

  const angle = MAX_TILT * Math.max(0, tilt - settle);
  // Wine surface height (world y, viewBox units): rises toward the lip while
  // tilting, empties while pouring, settles as a small remainder upright.
  const level = 40 + 42 * tilt + 6 * pour - 8 * settle;

  return {
    "--enter": enter,
    "--angle": `${angle}deg`,
    "--level": `${level}px`,
    "--pour": pour,
    "--stop": stop,
    "--fill": fill,
    "--r1": ease(seg(p, 0.54, 0.64)),
    "--r2": ease(seg(p, 0.58, 0.68)),
    "--r3": ease(seg(p, 0.62, 0.74)),
    "--r4": ease(seg(p, 0.68, 0.8)),
    "--photo": ease(seg(p, 0.46, 0.72)),
    "--peek": peek,
    "--hop": hop,
    "--hop-y": `${-Math.sin(Math.PI * hop) * 26}px`,
    "--turn": ease(seg(p, 0.86, 0.9)),
    "--exit": exit,
    "--p": p,
  } as Record<string, number | string>;
}

const FINAL = frame(0.88); // what no-JS and reduced-motion visitors see

function apply(el: HTMLElement, vars: Record<string, number | string>) {
  for (const k in vars) el.style.setProperty(k, String(vars[k]));
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function FounderSection() {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const stage = stageRef.current;
    if (!el || !stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      el.dataset.static = "";
      apply(el, FINAL);
      return;
    }
    delete el.dataset.static;

    let raf = 0;
    let last = -1;
    const fit = () => {
      // Scale the composition down on short screens so glass + card always fit.
      const natural = stage.scrollHeight || 760;
      const room = window.innerHeight - 84;
      el.style.setProperty("--fit", String(Math.min(1, Math.max(0.6, room / natural))));
    };
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? clamp01(-r.top / total) : 1;
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      apply(el, frame(p));
      el.dataset.peek = p > 0.4 && p < 0.74 ? "1" : "0";
      el.dataset.landed = p > 0.88 ? "1" : "0";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      fit();
      onScroll();
    };
    fit();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={ref}
      id="founder"
      aria-labelledby="founder-name"
      className="fd-section"
      style={FINAL as React.CSSProperties}
      data-static=""
    >
      <div className="fd-stage">
        {/* Atmosphere */}
        <div aria-hidden className="fd-words">
          <span className="fd-word fd-word-a">BUILD.</span>
          <span className="fd-word fd-word-b">NEVER STOP.</span>
        </div>
        <div aria-hidden className="fd-glow" />
        <div aria-hidden className="fd-motes">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>

        <div ref={stageRef} className="fd-composition">
          <p className="fd-kicker">Meet the founder</p>

          {/* Glass + stream, drawn above the card; the stream ends on the card's top edge */}
          <svg className="fd-pour" viewBox="0 0 240 200" aria-hidden>
            <defs>
              <linearGradient id="fd-wine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="45%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>
              <linearGradient id="fd-stream" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DDD6FE" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <clipPath id="fd-bowl-clip">
                <path d="M61 14 C61 60 73 84 90 86 C107 84 119 60 119 14 Z" />
              </clipPath>
              <filter id="fd-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* stream (drawn top → bottom by --pour, detaches downward by --stop) */}
            <g className="fd-stream">
              <path className="fd-stream-glow" d="M120 86 C121.5 100 120.4 114 120 130 L120 200" pathLength={1} />
              <path className="fd-stream-core" d="M120 86 C121.5 100 120.4 114 120 130 L120 200" pathLength={1} />
              <path className="fd-stream-flow" d="M120 86 C121.5 100 120.4 114 120 130 L120 200" pathLength={1} />
            </g>
            <ellipse className="fd-splash" cx="120" cy="197" rx="26" ry="5" filter="url(#fd-soft)" />

            {/* the glass */}
            <g className="fd-glass" style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}>
              <ellipse className="fd-glass-aura" cx="90" cy="50" rx="36" ry="32" filter="url(#fd-soft)" />
              <g clipPath="url(#fd-bowl-clip)">
                {/* counter-rotated so the wine surface stays level */}
                <g className="fd-wine" style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}>
                  <rect className="fd-wine-body" x="-60" width="300" height="300" fill="url(#fd-wine)" />
                  <rect className="fd-wine-surface" x="-60" width="300" height="1.6" fill="#EDE9FE" opacity="0.8" />
                </g>
              </g>
              <path className="fd-glass-bowl" d="M61 14 C61 60 73 84 90 86 C107 84 119 60 119 14 Z" />
              <path className="fd-glass-rim" d="M61 14 Q90 19 119 14" />
              <path className="fd-glass-shine" d="M68 22 C68 48 74 66 84 76" />
              <path className="fd-glass-stem" d="M88.6 86 L88.6 138 Q90 141 91.4 138 L91.4 86 Z" />
              <ellipse className="fd-glass-foot" cx="90" cy="141" rx="22" ry="3.6" />
            </g>
          </svg>

          {/* Card */}
          <div className="fd-card-wrap">
            <Bunny />
            <article className="fd-card">
              <div aria-hidden className="fd-ring-mask">
                <div className="fd-ring" />
              </div>
              <div className="fd-photo">
                <picture>
                  <source type="image/webp" srcSet={`${FOUNDER.portrait.webpSm} 480w, ${FOUNDER.portrait.webp} 800w`} sizes="(max-width: 640px) 84vw, 360px" />
                  <img
                    src={FOUNDER.portrait.jpg}
                    srcSet={`${FOUNDER.portrait.jpgSm} 480w, ${FOUNDER.portrait.jpg} 800w`}
                    sizes="(max-width: 640px) 84vw, 360px"
                    alt={FOUNDER.portrait.alt}
                    width={800}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <span aria-hidden className="fd-photo-grade" />
              </div>
              <div className="fd-body">
                <h2 id="founder-name" className="fd-name fd-r1">
                  {FOUNDER.name}
                </h2>
                <p className="fd-title fd-r2">{FOUNDER.title}</p>
                <p className="fd-mission fd-r3">&ldquo;{FOUNDER.mission}&rdquo;</p>
                <div className="fd-actions fd-r4">
                  <span className="fd-handle">{FOUNDER.instagramHandle}</span>
                  <a className="fd-follow" href={FOUNDER.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Instagram size={16} aria-hidden />
                    Follow on Instagram
                    <ArrowUpRight size={15} aria-hidden className="fd-follow-arrow" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A small sitting bunny that peeks out from behind the card, then hops beside it. */
function Bunny() {
  return (
    <span aria-hidden className="fd-bunny">
      <svg viewBox="0 0 48 52" width="100%" height="100%">
        <defs>
          <linearGradient id="fd-fur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5F3FF" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
        </defs>
        <g className="fd-ear fd-ear-l">
          <path d="M17 20 C12 12 12 2 16 1.5 C20 1 21.5 11 21 20 Z" fill="url(#fd-fur)" />
          <path d="M16.6 17 C14.5 11 14.6 5 16.2 4.6 C17.8 4.4 18.6 10 18.6 17 Z" fill="#DDD6FE" />
        </g>
        <g className="fd-ear fd-ear-r">
          <path d="M26 20 C26.5 11 29 1.5 33 2.2 C37 3 34.5 13 29.8 21 Z" fill="url(#fd-fur)" />
          <path d="M27.6 18 C28.3 11 30.3 5.2 31.8 5.6 C33.3 6 32 12 29.6 18.5 Z" fill="#DDD6FE" />
        </g>
        <ellipse cx="25" cy="38" rx="15" ry="13" fill="url(#fd-fur)" />
        <circle cx="23.5" cy="25" r="9.5" fill="url(#fd-fur)" />
        <circle cx="39" cy="44" r="3.4" fill="#F5F3FF" />
        <circle cx="20" cy="24" r="1.25" fill="#2E1065" />
        <circle cx="16.4" cy="27.4" r="0.9" fill="#A78BFA" />
        <ellipse cx="18" cy="49.5" rx="5" ry="2" fill="#E9E5FF" />
      </svg>
    </span>
  );
}
