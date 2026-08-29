"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { NextMoveRecommendation } from "@/lib/creativeHealth";

export function NextMoveCard({ recommendation }: { recommendation: NextMoveRecommendation | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Only makes sense once there's real signal data to base it on — no
  // recommendation exists without a real weakest signal to point to.
  if (!recommendation) return null;

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-brand/20 bg-base-card p-6 transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div
        className="pointer-events-none absolute -inset-1 -z-10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(500px circle at 0% 0%, rgba(139,92,246,0.12), transparent)" }}
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-brand-light">✦</span>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Your Next Move</p>
          <h3 className="mt-1.5 text-lg font-medium text-ink-primary">{recommendation.headline}</h3>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">{recommendation.description}</p>
          <Link
            href="/my-creatives"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-light transition-colors hover:text-brand-light/80"
          >
            View Recommendations
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
