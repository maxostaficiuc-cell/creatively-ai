"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { checkoutUrlFor } from "@/lib/whop-plans";

const personas = [
  "Agency",
  "Media Buyer",
  "Founder",
  "E-commerce Brand",
  "Coach / Consultant",
  "Service Business",
  "Creator",
  "Marketing Team",
  "Other",
];

const platforms = ["Meta", "TikTok", "Google", "Multiple", "I don't run ads yet"];

const goals = [
  "Create better ads",
  "Analyze creatives",
  "Find winning ads",
  "Improve campaign performance",
  "Generate leads",
  "Increase sales",
  "Improve ROAS",
];

const VALID_PLANS = ["Starter", "Pro", "Business"];

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}

function OnboardingForm() {
  const searchParams = useSearchParams();
  // The plan the user actually clicked on the pricing page, carried
  // through signup as ?plan=Business — used ONLY to pick which checkout
  // link to send them to next. It is never written to their profile here;
  // the profile's real plan/credits are set exclusively by the verified
  // Whop webhook once payment actually succeeds.
  const requestedPlanParam = searchParams.get("plan");
  const requestedPlan = VALID_PLANS.includes(requestedPlanParam || "") ? requestedPlanParam! : "Starter";

  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      question: "What best describes you?",
      options: personas,
      value: persona,
      set: setPersona,
    },
    {
      question: "What platforms do you advertise on?",
      options: platforms,
      value: platform,
      set: setPlatform,
    },
    {
      question: "What is your main goal?",
      options: goals,
      value: goal,
      set: setGoal,
    },
  ];

  function goToCheckoutOrDashboard() {
    // No free trial, but also — critically — no free access. This only
    // sends the browser to Whop's checkout; nothing here marks the
    // account as paid. If no checkout link is configured, land on the
    // dashboard rather than getting stuck (the dashboard itself shows 0
    // credits until a real payment webhook arrives).
    //
    // .replace() rather than setting .href — this swaps the current
    // history entry instead of pushing a new one, so pressing Back from
    // Whop's checkout doesn't land the user right back on this onboarding
    // form.
    const checkoutUrl = checkoutUrlFor(requestedPlan, "monthly");
    window.location.replace(checkoutUrl || "/dashboard");
  }

  async function finish(skip = false) {
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Deliberately does NOT touch plan, subscription_status, or
        // ai_credits — onboarding answers have no bearing on billing.
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            persona: skip ? null : persona,
            ad_platforms: skip || !platform ? null : [platform],
            main_goal: skip ? null : goal,
            onboarding_completed: true,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Failed to save onboarding answers:", updateError.message);
          // Non-fatal — still let the user continue to checkout rather
          // than getting stuck on a save error for non-critical data.
        }
      }
    } catch (err) {
      console.error("Onboarding save failed:", err);
      // Same reasoning — don't trap the user here over a network hiccup.
    } finally {
      goToCheckoutOrDashboard();
    }
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-bg px-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-base-border bg-base-card p-8">
          <div className="mb-6 flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-brand" : "bg-base-border"
                }`}
              />
            ))}
          </div>

          <h1 className="text-lg font-semibold text-ink-primary">{current.question}</h1>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => current.set(opt)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  current.value === opt
                    ? "border-brand bg-brand/10 text-ink-primary"
                    : "border-base-border bg-base-surface text-ink-secondary hover:border-brand/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => finish(true)}
              disabled={saving}
              className="text-sm text-ink-muted hover:text-ink-secondary disabled:opacity-60"
            >
              {saving ? "…" : "Skip for now"}
            </button>

            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={saving}>
                  Back
                </Button>
              )}
              <Button
                disabled={!current.value || saving}
                onClick={() => (isLast ? finish(false) : setStep(step + 1))}
              >
                {saving ? "Saving…" : isLast ? "Finish" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
