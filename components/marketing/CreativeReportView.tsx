"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CreativeReport } from "@/lib/analyzeCreative";
import { ReportExperience, type ReportContext } from "@/components/report/ReportExperience";

export const VERDICT_TONE: Record<CreativeReport["final_recommendation"]["verdict"], string> = {
  YES: "border-accent-green/40 text-accent-green bg-accent-green/10",
  "YES — WITH CHANGES": "border-brand/40 text-brand-light bg-brand/10",
  "TEST FIRST": "border-orange-400/40 text-orange-400 bg-orange-400/10",
  "NO — REWORK REQUIRED": "border-accent-red/40 text-accent-red bg-accent-red/10",
};

export function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  id,
  open: controlledOpen,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Optional: anchor id (used by the full-analysis report's section navigation). */
  id?: string;
  /** Optional controlled mode. */
  open?: boolean;
  onToggle?: () => void;
}) {
  const [uncontrolledOpen, setOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  return (
    <div id={id} className="scroll-mt-4 rounded-2xl border border-base-border bg-base-card">
      <button
        onClick={() => (onToggle ? onToggle() : setOpen(!open))}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink-primary">
          <span className="text-brand-light">{icon}</span>
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

/**
 * The full creative report. Used on the dashboard (My Creatives, Analyze) and
 * on public free-report pages. The UI lives in components/report/*; this
 * wrapper keeps the original import path and props working.
 */
export function CreativeReportView({
  report,
  imageUrl,
  isSimulated,
  upgrade = null,
  reportId,
  context,
  adAccountConnected,
  onReanalyze,
}: {
  report: CreativeReport;
  imageUrl?: string | null;
  isSimulated?: boolean;
  /** Rendered after the full report — never before or over it. */
  upgrade?: React.ReactNode;
  /** Enables "mark as done" on fixes (saved in this browser). */
  reportId?: string;
  /** "public" = marketing report pages (site header is 64px and sticky). */
  context?: ReportContext;
  /** Dashboard only: whether a Meta ad account is connected. */
  adAccountConnected?: boolean;
  onReanalyze?: () => void;
}) {
  return (
    <ReportExperience
      report={report}
      imageUrl={imageUrl}
      isSimulated={isSimulated}
      upgrade={upgrade}
      reportId={reportId}
      context={context ?? (upgrade ? "public" : "app")}
      adAccountConnected={adAccountConnected}
      onReanalyze={onReanalyze}
    />
  );
}
