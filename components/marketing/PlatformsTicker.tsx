"use client";

import { useEffect, useRef, useState } from "react";
import { AD_PLATFORMS } from "@/lib/platformLogos";

// ─────────────────────────────────────────────────────────────────────────────
// Platforms ticker + live analyses counter.
//
// Left:  a seamless CSS-keyframe marquee of TikTok / Meta / Google / Pinterest
//        Ads (content duplicated once; the track slides exactly one copy).
// Right: the REAL number of completed creative analyses, from the existing
//        /api/public-stats endpoint. It counts up when it comes into view and
//        only rises when that real number rises (re-checked every minute while
//        visible). No simulated increments — if the stat isn't available, the
//        number is simply not shown.
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 60_000;
// Survives client-side navigation / remounts so the number doesn't reset.
let lastKnown: number | null = null;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function Logo({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="pt-logo" aria-hidden focusable="false">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

function PlatformSet({ hidden = false }: { hidden?: boolean }) {
  // Two copies of the four platforms per half, so even a very wide strip is
  // always full while the track moves.
  const items = [...AD_PLATFORMS, ...AD_PLATFORMS];
  return (
    <ul className="pt-set" aria-hidden={hidden || undefined}>
      {items.map((p, i) => (
        <li key={`${p.id}-${i}`} className="pt-item" aria-hidden={i >= AD_PLATFORMS.length || undefined}>
          <Logo path={p.path} />
          <span>{p.name}</span>
        </li>
      ))}
    </ul>
  );
}

function LiveCounter() {
  const numRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">(lastKnown !== null ? "ready" : "loading");

  useEffect(() => {
    const el = numRef.current;
    const box = boxRef.current;
    if (!el || !box) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let shown = lastKnown ?? 0;
    let raf = 0;
    let timer = 0;
    let visible = false;
    let cancelled = false;
    if (lastKnown !== null) el.textContent = fmt(lastKnown);

    // Smoothly roll the displayed number to `to` (writes text directly — no re-renders).
    const animateTo = (to: number, ms: number) => {
      cancelAnimationFrame(raf);
      if (reduced || ms === 0) {
        shown = to;
        el.textContent = fmt(to);
        return;
      }
      const from = shown;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        const eased = 1 - Math.pow(1 - k, 3);
        shown = from + (to - from) * eased;
        el.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const load = async (first: boolean) => {
      try {
        const res = await fetch("/api/public-stats");
        const json = (await res.json()) as { creativesAnalyzed?: number; configured?: boolean };
        if (cancelled) return;
        const n = Number(json.creativesAnalyzed);
        if (!json.configured || !Number.isFinite(n) || n <= 0) {
          if (lastKnown === null) setState("unavailable");
          return;
        }
        setState("ready");
        if (first && lastKnown === null) {
          animateTo(n, 1600); // entrance: count up from 0
        } else if (n !== lastKnown) {
          animateTo(n, 1200); // a real new analysis happened → roll to it
        }
        lastKnown = n;
      } catch {
        if (!cancelled && lastKnown === null) setState("unavailable");
      }
    };

    // Only fetch / poll while the section is on screen and the tab is visible.
    const schedule = () => {
      window.clearInterval(timer);
      if (visible && !document.hidden) timer = window.setInterval(() => load(false), POLL_MS);
    };
    let firstLoad = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && firstLoad) {
        firstLoad = false;
        load(true);
      }
      schedule();
    }, { rootMargin: "120px 0px" });
    io.observe(box);
    document.addEventListener("visibilitychange", schedule);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      io.disconnect();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, []);

  return (
    <div ref={boxRef} className={`pt-counter ${state === "ready" ? "is-ready" : ""}`}>
      <div aria-hidden className="pt-counter-glow" />
      {state !== "unavailable" ? (
        <>
          <p className="pt-number" aria-live="polite">
            <span ref={numRef}>0</span>
            <span className="text-brand-light">+</span>
          </p>
          <p className="pt-label">Creative analyses for advertisers</p>
          <p className="pt-live">
            <span className="pt-live-dot" aria-hidden />
            Live count of completed analyses
          </p>
        </>
      ) : (
        <p className="pt-label pt-label-solo">Creative analysis for the platforms you advertise on</p>
      )}
    </div>
  );
}

export function PlatformsTicker() {
  return (
    <section aria-label="Ad platforms and live analyses" className="pt-section relative overflow-hidden border-t border-white/5 px-5 py-9 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
        <div data-reveal className="min-w-0">
          <p className="mb-5 hidden text-left text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted lg:block">
            Analyze ad creatives made for
          </p>
          <div className="pt-marquee">
            <div className="pt-track">
              <PlatformSet />
              <PlatformSet hidden />
            </div>
          </div>
        </div>
        <div data-reveal style={{ ["--d" as string]: 1 }}>
          <LiveCounter />
        </div>
      </div>
    </section>
  );
}
