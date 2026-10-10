"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { FullAnalysisModal } from "@/components/hero/FullAnalysisModal";
import type { DemoCreative } from "@/lib/demoCreative";

/**
 * The "Show full analysis" button — opens the complete report for the same
 * creative the phone and cards show. Used by both the desktop and mobile hero.
 */
export function FullAnalysisButton({
  creative,
  className = "",
  tabIndex,
}: {
  creative: DemoCreative;
  className?: string;
  tabIndex?: number;
}) {
  const [open, setOpen] = useState(false);
  // the modal portals into document.body, which only exists after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        tabIndex={tabIndex}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-white/80 backdrop-blur transition-colors hover:border-brand/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${className}`}
      >
        Show full analysis
        <ChevronRight size={14} />
      </button>
      {open && mounted && <FullAnalysisModal creative={creative} onClose={() => setOpen(false)} />}
    </>
  );
}
