"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// One shared view of the user's credit balance for the whole dashboard.
// It starts from the server-rendered profile and only ever changes to a value
// the server returned: either a page refresh, or a charge the analyze API
// confirmed. Nothing here deducts credits; it only displays them.

export type ConfirmedCharge = { id: string; amount: number; from: number; to: number; at: number };

type Ctx = {
  balance: number;
  allowance: number;
  /** The most recent server-confirmed charge (drives the animation). */
  charge: ConfirmedCharge | null;
  /** Call with values from the analyze API response. Ignores repeats of the same id. */
  confirmCharge: (id: string, amount: number, newBalance: number) => void;
};

const CreditsCtx = createContext<Ctx | null>(null);

export function CreditsProvider({
  initialBalance,
  allowance,
  children,
}: {
  initialBalance: number;
  allowance: number;
  children: React.ReactNode;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [charge, setCharge] = useState<ConfirmedCharge | null>(null);
  const seen = useRef(new Set<string>());
  const balanceRef = useRef(initialBalance);

  // A server refresh (router.refresh / navigation) is the source of truth.
  useEffect(() => {
    balanceRef.current = initialBalance;
    setBalance(initialBalance);
  }, [initialBalance]);

  const confirmCharge = useCallback((id: string, amount: number, newBalance: number) => {
    if (!id || seen.current.has(id)) return;
    seen.current.add(id);
    const from = balanceRef.current;
    const to = Math.max(0, newBalance);
    balanceRef.current = to;
    setBalance(to);
    if (amount > 0) setCharge({ id, amount, from: Math.max(from, to), to, at: Date.now() });
  }, []);

  const value = useMemo(() => ({ balance, allowance, charge, confirmCharge }), [balance, allowance, charge, confirmCharge]);
  return <CreditsCtx.Provider value={value}>{children}</CreditsCtx.Provider>;
}

export function useCredits() {
  return useContext(CreditsCtx);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True for ~1s after a confirmed charge (used for the red accents). */
function useChargeFlash(charge: ConfirmedCharge | null, ms = 1000) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!charge) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), ms);
    return () => clearTimeout(t);
  }, [charge, ms]);
  return active;
}

/** Balance number that counts down after a confirmed charge, with a "−100 credits" tag. */
export function CreditCount({
  fallback,
  className = "",
  announce = false,
}: {
  fallback: number;
  className?: string;
  /** Only one visible counter should announce charges to screen readers. */
  announce?: boolean;
}) {
  const ctx = useCredits();
  const balance = ctx?.balance ?? fallback;
  const charge = ctx?.charge ?? null;
  const [shown, setShown] = useState(balance);
  const flash = useChargeFlash(charge, 1100);

  useEffect(() => {
    if (!charge || charge.to !== balance || prefersReducedMotion()) {
      setShown(balance);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(charge.from + (charge.to - charge.from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [balance, charge]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <span className={`tabular-nums transition-colors duration-500 ${flash ? "text-[#F87171]" : ""}`}>{shown.toLocaleString()}</span>
      {announce && (
        <span className="sr-only" aria-live="polite">
          {charge ? `${charge.amount} credits used. ${balance} credits remaining.` : ""}
        </span>
      )}
    </span>
  );
}

/** The short-lived "−100 credits" tag. Place inside a `relative` container. */
export function CreditDelta({ className = "" }: { className?: string }) {
  const charge = useCredits()?.charge ?? null;
  const flash = useChargeFlash(charge, 1100);
  if (!flash || !charge) return null;
  return (
    <span key={charge.id} aria-hidden className={`credit-delta ${className}`}>
      −{charge.amount.toLocaleString()} credits
    </span>
  );
}

/** Remaining-credits bar; turns red briefly and slides down after a confirmed charge. */
export function CreditBar({ fallback, allowance }: { fallback: number; allowance: number }) {
  const ctx = useCredits();
  const balance = ctx?.balance ?? fallback;
  const flash = useChargeFlash(ctx?.charge ?? null, 900);
  const pct = allowance > 0 ? Math.min(100, Math.max(0, (balance / allowance) * 100)) : 0;
  return (
    <div
      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-base-border"
      role="progressbar"
      aria-label="AI credits remaining"
      aria-valuemin={0}
      aria-valuemax={allowance}
      aria-valuenow={balance}
    >
      <div className={`credit-bar h-full rounded-full ${flash ? "credit-bar-hit" : "bg-brand"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
