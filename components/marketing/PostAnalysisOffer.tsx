"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { TrialButton } from "@/components/marketing/TrialButton";
import { STARTER_TRIAL } from "@/lib/starterTrial";

/**
 * Shown inline AFTER the analysis results on a report page — never before
 * the report, never as a blocking pop-up.
 *
 *  • "offer"      → visitor isn't subscribed: the $1 Starter offer (or, if the
 *                   offer isn't configured, a plain link to the plans).
 *  • "subscriber" → already paying: product actions instead of a promotion.
 *
 * "Maybe later" hides it for this report for the rest of the browser session.
 */
export function PostAnalysisOffer({ reportId, mode }: { reportId: string; mode: "offer" | "subscriber" }) {
  const storageKey = `cai_offer_dismissed_${reportId}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) === "1") setDismissed(true);
    } catch {
      /* storage unavailable — just show the card */
    }
  }, [storageKey]);

  if (dismissed) return null;

  if (mode === "subscriber") {
    return (
      <div className="pao-card">
        <p className="text-base font-medium text-ink-primary">Keep going with your next creative.</p>
        <div className="mt-4 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Link
            href="/analyze"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-light"
          >
            Analyze another creative <ArrowRight size={15} aria-hidden />
          </Link>
          <Link
            href="/my-creatives"
            className="inline-flex h-11 items-center rounded-full border border-white/10 px-5 text-sm text-ink-secondary transition-colors hover:border-brand/40 hover:text-ink-primary"
          >
            View my creatives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="pao-title" className="pao-card">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand/15 text-brand-light">
        <Sparkles size={18} aria-hidden />
      </span>
      <h2 id="pao-title" className="mt-4 text-lg font-semibold tracking-tight text-ink-primary sm:text-xl">
        Want to analyze more creatives?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
        Get more insights into your ads, identify opportunities to improve them, and discover what to
        test next.
      </p>

      {STARTER_TRIAL.enabled ? (
        <>
          <p className="mt-4 text-sm font-medium text-ink-primary">
            Offer: ${STARTER_TRIAL.introPrice} for your first {STARTER_TRIAL.days} days, then $
            {STARTER_TRIAL.renewalPrice}/month.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <TrialButton placement="post-analysis" className="w-full sm:w-auto sm:min-w-[180px]">
              Try for $1
            </TrialButton>
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                try {
                  sessionStorage.setItem(storageKey, "1");
                } catch {
                  /* ignore */
                }
              }}
              className="h-11 rounded-full px-5 text-sm text-ink-muted transition-colors hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-light"
            >
              Maybe later
            </button>
          </div>
        </>
      ) : (
        <Link
          href="/pricing"
          className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-light"
        >
          See plans <ArrowRight size={15} aria-hidden />
        </Link>
      )}
    </section>
  );
}
