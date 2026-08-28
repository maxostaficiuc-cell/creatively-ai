"use client";

import { useState } from "react";
import { Check, X, TrendingUp, CreditCard, AlertTriangle } from "lucide-react";
import type { Profile } from "@/lib/types";
import { CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";
import { PLANS, getPlan, type Plan } from "@/lib/pricing";
import { checkoutUrlFor, type BillingInterval } from "@/lib/whop-plans";
import { TalkToSalesButton } from "@/components/marketing/TalkToSalesButton";

const TOP_UP_PACKAGES = [
  { credits: 1000, price: "$4.99" },
  { credits: 5000, price: "$19.99" },
  { credits: 10000, price: "$34.99" },
];

// ─── Credit progress color ─────────────────────────────────────────────────────
function creditBarColor(pct: number): string {
  if (pct > 65) return "bg-accent-green";
  if (pct > 35) return "bg-orange-400";
  if (pct > 5) return "bg-accent-red";
  return "bg-red-900";
}

function creditTextColor(pct: number): string {
  if (pct > 65) return "text-accent-green";
  if (pct > 35) return "text-orange-400";
  if (pct > 5) return "text-accent-red";
  return "text-red-700";
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function CreditProgress({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
  const used = total - remaining;
  const barColor = creditBarColor(pct);
  const textColor = creditTextColor(pct);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-secondary">
          <span className="font-medium text-ink-primary">{remaining.toLocaleString()}</span>
          {" / "}
          {total.toLocaleString()} credits remaining
        </span>
        <span className={`font-semibold ${textColor}`}>{pct}% remaining</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-base-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-ink-muted">{used.toLocaleString()} credits used this period</p>
    </div>
  );
}

function PlanSummaryCard({
  profile,
  onBuyCredits,
}: {
  profile: Profile;
  onBuyCredits: () => void;
}) {
  const plan = getPlan(profile.plan || "Pro");
  const totalCredits = plan.weeklyCredits ?? 0;
  // profile.ai_credits is kept correct by the weekly reset logic (see
  // lib/profile.ts) — never fabricated or clamped here.
  const remaining = Math.min(profile.ai_credits ?? totalCredits, totalCredits);
  const used = totalCredits - remaining;
  const resetDate = new Date(profile.credits_reset_at);
  const priceDisplay = plan.monthlyPrice === null ? "Let's Talk" : `$${plan.monthlyPrice}`;

  return (
    <div className="rounded-2xl border border-base-border bg-base-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-ink-primary">Plan Summary</h2>
          <p className="mt-0.5 text-sm text-ink-secondary">Your current subscription and credit status</p>
        </div>
        <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-light">
          {plan.name}
        </span>
      </div>

      <CreditProgress remaining={remaining} total={totalCredits} />
      <p className="mt-2 text-xs text-ink-muted">
        Credits reset weekly · Next reset:{" "}
        {resetDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })} at{" "}
        {resetDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </p>

      <div className="mt-4">
        <button
          onClick={onBuyCredits}
          className="flex items-center gap-2 rounded-xl border border-base-border bg-base-surface px-4 py-2 text-xs font-medium text-ink-primary transition-colors hover:border-brand/50"
        >
          <CreditCard size={14} />
          Buy Credits
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-base-border pt-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink-muted">Price / Month</p>
          <p className="mt-1 text-sm font-medium text-ink-primary">{priceDisplay}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Credits Used</p>
          <p className="mt-1 text-sm font-medium text-ink-primary">{used.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Weekly Credits</p>
          <p className="mt-1 text-sm font-medium text-ink-primary">{totalCredits.toLocaleString()}</p>
          {plan.fourWeekCredits && (
            <p className="mt-0.5 text-[11px] text-ink-muted">{plan.fourWeekCredits} / 4-week period</p>
          )}
        </div>
        <div>
          <p className="text-xs text-ink-muted">Next Reset</p>
          <p className="mt-1 text-sm font-medium text-ink-primary">
            {resetDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  currentPlanId,
  interval,
}: {
  plan: Plan;
  currentPlanId: string;
  interval: BillingInterval;
}) {
  const currentPlan = getPlan(currentPlanId);
  const isCurrent = plan.id === currentPlanId;
  const isEnterprise = plan.monthlyPrice === null;
  const isUpgrade = plan.rank > currentPlan.rank;

  // Dashboard-context CTA: upgrade wording toward the user's next plan,
  // "Talk to Sales" for Enterprise, or a plain switch for a downgrade.
  let ctaLabel = plan.ctaCurrent;
  if (!isCurrent) {
    if (isEnterprise) ctaLabel = "Talk to Sales";
    else if (isUpgrade) ctaLabel = `Upgrade to ${plan.name}`;
    else ctaLabel = `Switch to ${plan.name}`;
  }

  const priceDisplay = isEnterprise
    ? "Let's Talk"
    : interval === "annual"
    ? `$${plan.annualPrice}`
    : `$${plan.monthlyPrice}`;
  const checkoutUrl = !isEnterprise ? checkoutUrlFor(plan.id, interval) : null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
        plan.highlight
          ? "border-brand/60 bg-base-card shadow-glow"
          : "border-base-border bg-base-card"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-glow">
          {plan.badge}
        </span>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-primary">{plan.name}</h3>
          {isCurrent && (
            <span className="rounded-full border border-base-border px-2.5 py-1 text-xs text-ink-muted">
              Current
            </span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${plan.highlight ? "text-brand-light" : "text-ink-primary"}`}>
            {priceDisplay}
          </span>
          {!isEnterprise && (
            <span className="text-sm text-ink-muted">{interval === "annual" ? "/year" : "/month"}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-ink-secondary">{plan.tagline}</p>
      </div>

      {!isCurrent && !isEnterprise ? (
        checkoutUrl ? (
          <a
            href={checkoutUrl}
            className={`mb-5 block w-full rounded-xl py-2.5 text-center text-sm font-medium transition-all ${
              plan.highlight
                ? "bg-gradient-to-b from-brand-light to-brand text-white shadow-glow hover:brightness-110"
                : "border border-base-border text-ink-primary hover:border-brand/50"
            }`}
          >
            {ctaLabel}
          </a>
        ) : (
          <div
            className="mb-5 w-full rounded-xl border border-base-border py-2.5 text-center text-sm text-ink-muted"
            title={`${interval === "annual" ? "Annual" : "Monthly"} checkout link not configured yet`}
          >
            {ctaLabel} — coming soon
          </div>
        )
      ) : !isCurrent && isEnterprise ? (
        <TalkToSalesButton
          className={`mb-5 w-full rounded-xl py-2.5 text-sm font-medium transition-all bg-gradient-to-b from-brand-light to-brand text-white shadow-glow hover:brightness-110`}
        >
          {ctaLabel}
        </TalkToSalesButton>
      ) : isCurrent ? (
        <button
          disabled
          className="mb-5 w-full cursor-default rounded-xl border border-base-border py-2.5 text-sm text-ink-muted"
        >
          {ctaLabel}
        </button>
      ) : null}

      <ul className="flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
            <Check size={14} className="mt-0.5 shrink-0 text-accent-green" />
            <span className={f.includes("Credits") ? "font-medium text-ink-primary" : ""}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────────────────────────────
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
  );
}

function TopUpModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-base-border bg-base-card p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink-primary">Buy Additional Credits</h3>
            <button onClick={onClose} className="text-ink-muted hover:text-ink-primary">
              <X size={18} />
            </button>
          </div>
          <p className="mb-5 text-sm text-ink-secondary">
            Purchase additional AI credits without changing your plan. Credits are added immediately.
          </p>
          <div className="space-y-3">
            {TOP_UP_PACKAGES.map((pkg) => (
              <button
                key={pkg.credits}
                onClick={() => setSelected(pkg.credits)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                  selected === pkg.credits
                    ? "border-brand bg-brand/10 text-ink-primary"
                    : "border-base-border text-ink-secondary hover:border-brand/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={14} className="text-accent-green" />
                  {pkg.credits.toLocaleString()} credits
                </span>
                <span className="font-medium text-ink-primary">{pkg.price}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-base-border py-2.5 text-sm text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              disabled={!selected}
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-b from-brand-light to-brand py-2.5 text-sm font-medium text-white shadow-glow hover:brightness-110 disabled:opacity-40"
            >
              Purchase Credits
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Real payment processing will be connected soon.
          </p>
        </div>
      </div>
    </>
  );
}

function CancelModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-base-border bg-base-card p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-red/10 text-accent-red">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-semibold text-ink-primary">Cancel your subscription?</h3>
          </div>
          <p className="mb-5 text-sm text-ink-secondary">
            Your plan will remain active until the end of your current billing period. You won&apos;t
            be charged again after that.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-b from-brand-light to-brand py-2.5 text-sm font-medium text-white shadow-glow hover:brightness-110"
            >
              Keep Plan
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-accent-red/40 py-2.5 text-sm text-accent-red hover:bg-accent-red/5"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────
export function BillingClient({ profile }: { profile: Profile }) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");

  const currentPlanId = profile.plan || "Pro";

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* Plan Summary */}
      <PlanSummaryCard profile={profile} onBuyCredits={() => setShowTopUp(true)} />

      {/* Pricing Plans */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="mb-1 font-semibold text-ink-primary">Plans</h2>
            <p className="text-sm text-ink-secondary">
              Upgrade or switch your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-base-border bg-base-card p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                interval === "monthly" ? "bg-base-surface text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annual")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                interval === "annual" ? "bg-base-surface text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              Annually
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlanId}
              interval={interval}
            />
          ))}
        </div>
      </div>

      {/* Credit usage info */}
      <div className="rounded-2xl border border-base-border bg-base-card p-5">
        <h3 className="mb-3 text-sm font-medium text-ink-primary">Credit Usage</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-base-border bg-base-surface p-3">
            <TrendingUp size={16} className="shrink-0 text-accent-green" />
            <div>
              <p className="text-xs text-ink-muted">Image analysis</p>
              <p className="text-sm font-medium text-ink-primary">{CREDIT_COST_IMAGE} credits</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-base-border bg-base-surface p-3">
            <TrendingUp size={16} className="shrink-0 text-brand-light" />
            <div>
              <p className="text-xs text-ink-muted">Video analysis</p>
              <p className="text-sm font-medium text-ink-primary">{CREDIT_COST_VIDEO} credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-base-border" />
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Danger Zone</span>
          <div className="h-px flex-1 bg-base-border" />
        </div>
        <div className="rounded-2xl border border-accent-red/20 bg-accent-red/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium text-ink-primary">Cancel subscription</h3>
              <p className="mt-1 text-sm text-ink-secondary">
                Your access remains active until the end of your billing period.
              </p>
            </div>
            <button
              onClick={() => setShowCancel(true)}
              className="shrink-0 rounded-xl border border-accent-red/40 px-5 py-2.5 text-sm text-accent-red transition-colors hover:bg-accent-red/10"
            >
              Cancel Plan
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
      {showCancel && <CancelModal onClose={() => setShowCancel(false)} />}
    </div>
  );
}
