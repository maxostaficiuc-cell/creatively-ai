"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Smoothly scrolls to a homepage section (the section's own scroll-margin keeps
 * it clear of the sticky header). Plain jump when the visitor prefers reduced
 * motion. Renders as a real link, so it still works without JavaScript.
 */
export function ScrollToButton({ target, children, className, variant = "secondary" }: { target: string; children: ReactNode; className?: string; variant?: "secondary" | "link" }) {
  return (
    <a
      href={`#${target}`}
      onClick={(e) => {
        const el = document.getElementById(target);
        if (!el) return;
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.pushState(null, "", `#${target}`);
      }}
      className={clsx(
        variant === "secondary"
          ? "inline-flex items-center justify-center gap-2 rounded-xl border border-base-border bg-base-card px-5 py-3 text-sm font-medium text-ink-primary transition-all duration-200 hover:border-brand/50"
          : "inline-flex items-center gap-1.5 text-ink-secondary transition-colors hover:text-ink-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
        className
      )}
    >
      {children}
    </a>
  );
}
