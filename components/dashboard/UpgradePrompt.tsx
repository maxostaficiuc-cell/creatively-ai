"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { nextPlan } from "@/lib/types";

const INTERVAL_MS = 7 * 60 * 1000;
const STORAGE_KEY = "upgradePromptNextShowAt";

export function UpgradePrompt({ profile }: { profile: Profile | null }) {
  const [visible, setVisible] = useState(false);
  const upgradeTarget = profile ? nextPlan(profile.plan) : null;

  useEffect(() => {
    if (!upgradeTarget) return;

    let nextShow = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
    if (!nextShow) {
      // Don't interrupt right after login — first prompt is ~7 minutes out.
      nextShow = Date.now() + INTERVAL_MS;
      sessionStorage.setItem(STORAGE_KEY, String(nextShow));
    }

    const check = () => {
      if (Date.now() >= Number(sessionStorage.getItem(STORAGE_KEY) || 0)) {
        setVisible(true);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [upgradeTarget]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, String(Date.now() + INTERVAL_MS));
  }

  if (!upgradeTarget || !visible) return null;

  return (
    <div className="animate-fade-scale-in fixed bottom-6 left-6 z-40 hidden w-72 rounded-2xl border border-brand/40 bg-base-card p-5 shadow-glow lg:block">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 text-ink-muted hover:text-ink-primary"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-2 text-sm font-medium text-ink-primary">
        <Sparkles size={15} className="text-brand-light" /> Boost with AI
      </div>
      <p className="mt-2 text-xs text-ink-secondary">
        Unlock more AI credits and advanced creative intelligence.
      </p>
      <Link
        href="/billing"
        onClick={dismiss}
        className="mt-4 block rounded-xl bg-gradient-to-b from-brand-light to-brand px-4 py-2.5 text-center text-xs font-medium text-white shadow-glow hover:brightness-110"
      >
        Upgrade to {upgradeTarget}
      </Link>
    </div>
  );
}
