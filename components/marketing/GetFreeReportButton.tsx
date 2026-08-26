"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FreeReportModal } from "@/components/marketing/FreeReportModal";

export function GetFreeReportButton({
  className,
  variant = "primary",
  children,
}: {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Portals must not render during SSR (no document) or before hydration —
  // this flag ensures createPortal only ever runs client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const styles: Record<string, string> = {
    primary:
      "bg-gradient-to-b from-brand-light to-brand text-white shadow-glow hover:brightness-110 active:scale-[0.98]",
    secondary: "bg-base-card border border-base-border text-ink-primary hover:border-brand/50 active:scale-[0.98]",
    ghost: "text-ink-secondary hover:text-ink-primary",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${styles[variant]} ${className || ""}`}
      >
        {children || "Get Your Free Report"}
      </button>
      {/* Rendered via a portal straight into document.body — this is
          required, not optional. The Nav this button often lives inside
          uses backdrop-blur, which per the CSS spec makes Nav the
          containing block for any position:fixed descendant. Without the
          portal, the modal gets trapped inside Nav's box no matter how
          high its z-index is. */}
      {open && mounted && createPortal(<FreeReportModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
