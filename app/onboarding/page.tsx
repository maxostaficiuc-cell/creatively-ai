"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

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

export default function OnboardingPage() {
  const router = useRouter();
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

  async function finish(skip = false) {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          persona: skip ? null : persona,
          ad_platforms: skip || !platform ? null : [platform],
          main_goal: skip ? null : goal,
          onboarding_completed: true,
        })
        .eq("id", user.id);
    }

    setSaving(false);
    router.push("/dashboard");
    router.refresh();
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
              className="text-sm text-ink-muted hover:text-ink-secondary"
            >
              Skip for now
            </button>

            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
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
