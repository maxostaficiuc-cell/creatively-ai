"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, HelpCircle } from "lucide-react";

type Phase = "confirmed" | "waiting" | "timed-out";
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 20; // ~40 seconds of polling before giving up gracefully

/**
 * Never trusts the redirect itself as proof of payment — that's exactly
 * the bug this replaced. This component only ever shows "confirmed" once
 * the server (via /api/subscription-status, reading the real database
 * row that only the verified Whop webhook can update) actually says so.
 */
export function CheckoutStatusPoller({ initiallyActive }: { initiallyActive: boolean }) {
  const [phase, setPhase] = useState<Phase>(initiallyActive ? "confirmed" : "waiting");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (phase !== "waiting") return;

    const interval = setInterval(async () => {
      attemptsRef.current += 1;
      try {
        const res = await fetch("/api/subscription-status");
        const data = await res.json();
        if (data.subscriptionStatus === "active") {
          setPhase("confirmed");
          clearInterval(interval);
          return;
        }
      } catch {
        // A transient network hiccup while polling isn't a reason to give
        // up early — just try again on the next tick.
      }
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setPhase("timed-out");
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "confirmed") {
    return (
      <>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="text-xl font-semibold text-ink-primary">Payment successful</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-secondary">
          Your subscription is now active. Your account is ready.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 rounded-xl bg-gradient-to-b from-brand-light to-brand px-6 py-3 text-sm font-medium text-white shadow-glow hover:brightness-110"
        >
          Go to Dashboard
        </Link>
      </>
    );
  }

  if (phase === "waiting") {
    return (
      <>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand-light">
          <Loader2 size={26} className="animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-ink-primary">Confirming your payment…</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-secondary">
          We&apos;re waiting for payment confirmation. This usually takes only a moment.
        </p>
      </>
    );
  }

  // timed-out — genuinely honest state: we can't yet confirm success, but
  // we also can't claim it failed (a plain checkout-link redirect can't
  // tell those apart from here). Never grants access either way.
  return (
    <>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-400/10 text-orange-400">
        <HelpCircle size={26} />
      </div>
      <h1 className="text-xl font-semibold text-ink-primary">Still confirming your payment</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-secondary">
        This is taking longer than usual. If your payment went through, your account will update
        automatically within a few minutes — no need to pay again. If something went wrong, you can
        try again below.
      </p>
      <div className="mt-7 flex gap-3">
        <Link
          href="/pricing"
          className="rounded-xl border border-base-border px-6 py-3 text-sm text-ink-primary hover:border-brand/50"
        >
          Try Again
        </Link>
        <Link
          href="/billing"
          className="rounded-xl bg-gradient-to-b from-brand-light to-brand px-6 py-3 text-sm font-medium text-white shadow-glow hover:brightness-110"
        >
          Check Billing
        </Link>
      </div>
    </>
  );
}
