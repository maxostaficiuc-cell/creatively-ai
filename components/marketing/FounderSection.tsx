"use client";

/* eslint-disable @next/next/no-img-element -- art-directed <picture> with webp + jpg */

import { useEffect, useLayoutEffect, useRef } from "react";
import { ArrowUpRight, Instagram } from "lucide-react";
import { FOUNDER } from "@/lib/founder";

// "Meet the founder" scene. It spans two sections:
//   1. the section above (children, e.g. "Built for people who spend money on
//      ads."), which holds the wine glass (<FounderGlass />), and
//   2. the founder section, a sticky stage with the founder card.
// While the first section scrolls through, the glass tilts and starts pouring;
// a violet stream runs from the glass rim down across the section boundary to
// the card. Once the card pins, the stream keeps pouring from above (it grows
// longer as the glass scrolls away), then detaches and the card fills, sharpens
// and reveals the profile. Everything is a pure function of scroll position,
// so scrolling back up plays it in reverse.
//
// Performance: one passive scroll listener, at most one rAF per frame, writing
// CSS custom properties on the scene element. React never re-renders on scroll.

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep

/** Glass geometry (viewBox 0 0 240 200): tilt pivot, full tilt, rim lip when fully tilted. */
const PIVOT = { x: 90, y: 50 };
const MAX_TILT = 100;
const LIP = { x: 120.4 / 240, y: 85 / 200 };

/**
 * r = progress through the section above (glass on screen → founder section reaches the top)
 * q = progress through the pinned founder stage
 */
function frame(r: number, q: number) {
  const genter = ease(seg(r, 0, 0.3));
  const tilt = ease(seg(r, 0.12, 0.5));
  const pour = seg(r, 0.45, 1);
  const enter = ease(seg(r, 0.55, 1));
  const stop = seg(q, 0.3, 0.5);
  const settle = ease(seg(q, 0.05, 0.4));
  const fill = ease(seg(q, 0.05, 0.5));
  const hop = seg(q, 0.74, 0.9);

  return {
    "--genter": genter,
    "--enter": enter,
    "--angle": `${MAX_TILT * Math.max(0, tilt - settle)}deg`,
    // Wine surface height (viewBox y): rises toward the lip while tilting,
    // empties while pouring, settles as a small remainder upright.
    "--level": `${40 + 42 * tilt + 6 * pour - 8 * settle}px`,
    "--pour": pour,
    "--stop": stop,
    "--fill": fill,
    "--photo": ease(seg(q, 0.12, 0.55)),
    "--r1": ease(seg(q, 0.42, 0.55)),
    "--r2": ease(seg(q, 0.48, 0.6)),
    "--r3": ease(seg(q, 0.54, 0.68)),
    "--r4": ease(seg(q, 0.62, 0.76)),
    "--peek": ease(seg(q, 0.18, 0.36)),
    "--hop": hop,
    "--hop-y": `${-Math.sin(Math.PI * hop) * 26}px`,
    "--turn": ease(seg(q, 0.9, 0.95)),
    "--exit": seg(q, 0.94, 1),
    "--p": q,
  } as Record<string, number | string>;
}

const FINAL = frame(1, 0.97); // what no-JS and reduced-motion visitors see

function apply(el: HTMLElement, vars: Record<string, number | string>) {
  for (const k in vars) el.style.setProperty(k, String(vars[k]));
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The wine glass. Place it inside the section that comes right before the founder section. */
export function FounderGlass() {
  return (
    <div className="fd-glass-slot" aria-hidden>
      <svg className="fd-glass-svg" viewBox="0 0 240 200">
        <defs>
          <linearGradient id="fd-wine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="45%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <clipPath id="fd-bowl-clip">
            <path d="M61 14 C61 60 73 84 90 86 C107 84 119 60 119 14 Z" />
          </clipPath>
          <filter id="fd-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
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
    </div>
  );
}

/**
 * Wraps the section that holds <FounderGlass /> (as children) plus the founder
 * section, so both share one set of scroll-driven values.
 */
export function FounderScene({ children }: { children: React.ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const compRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const scene = sceneRef.current;
    const section = sectionRef.current;
    const comp = compRef.current;
    if (!scene || !section || !comp) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scene.dataset.static = "";
      apply(scene, FINAL);
      return;
    }
    delete scene.dataset.static;
    const glass = scene.querySelector<SVGSVGElement>(".fd-glass-svg");
    const card = scene.querySelector<HTMLElement>(".fd-card");

    let raf = 0;
    const fit = () => {
      // Scale the card composition down on short screens so it always fits.
      const natural = comp.scrollHeight || 620;
      const room = window.innerHeight - 84;
      scene.style.setProperty("--fit", String(Math.min(1, Math.max(0.62, room / natural))));
    };
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const sy = window.scrollY;
      const sec = section.getBoundingClientRect();
      const B = sec.top + sy; // founder section reaches the top: stage pins
      const C = B + section.offsetHeight - vh; // stage releases
      let A = B - vh; // fallback if the glass is missing
      const g = glass?.getBoundingClientRect();
      if (g) A = g.top + sy - vh * 0.82; // glass rises into view
      const r = B > A ? clamp01((sy - A) / (B - A)) : 1;
      const q = C > B ? clamp01((sy - B) / (C - B)) : 1;
      const v = frame(r, q);
      apply(scene, v);

      // Stream: from the glass rim (fully tilted) straight down to the card's top edge.
      if (g && card) {
        const s = scene.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        const x = g.left + g.width * LIP.x - s.left;
        const lipY = g.top + g.height * LIP.y - s.top;
        const L = Math.max(0, c.top + 2 - s.top - lipY);
        const pour = v["--pour"] as number;
        const stop = v["--stop"] as number;
        const top = lipY + L * stop;
        const bottom = lipY + L * pour;
        scene.style.setProperty("--sx", `${x}px`);
        scene.style.setProperty("--sy", `${top}px`);
        scene.style.setProperty("--sh", `${Math.max(0, bottom - top)}px`);
      }
      scene.dataset.peek = q > 0.22 && q < 0.74 ? "1" : "0";
      scene.dataset.landed = q > 0.92 ? "1" : "0";
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
    <div ref={sceneRef} className="fd-scene" style={FINAL as React.CSSProperties} data-static="">
      {children}

      <section ref={sectionRef} id="founder" aria-labelledby="founder-name" className="fd-section">
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

          <div ref={compRef} className="fd-composition">
            {/* split around the centre line so the stream passes between the words */}
            <p className="fd-kicker">
              <span>Meet the</span>
              <span>founder</span>
            </p>

            <div className="fd-card-wrap">
              <span aria-hidden className="fd-splash" />
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

      {/* The pour: spans both sections, so it lives on the scene, above everything */}
      <span aria-hidden className="fd-stream" />
    </div>
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
