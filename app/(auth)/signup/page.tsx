"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { CONSENT_TEXT } from "@/lib/consentText";

const VALID_PLANS = ["Starter", "Pro", "Business"];

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPlanParam = searchParams.get("plan");
  const requestedPlan = VALID_PLANS.includes(requestedPlanParam || "") ? requestedPlanParam : null;
  // Carries the plan the user actually clicked on the pricing page through
  // to onboarding — including across the email verification round trip,
  // via the callback route's existing ?next= support. This is ONLY used
  // to pick which checkout link onboarding sends them to; it never grants
  // access by itself.
  // ?offer=trial (the $1 Starter introductory offer) is carried the same way,
  // and only for Starter — it changes which Whop checkout link is used.
  const trialOffer = requestedPlan === "Starter" && searchParams.get("offer") === "trial";
  // Came back from a pay-first checkout: no second checkout after onboarding.
  const paidFirst = searchParams.get("paid") === "1";
  const onboardingPath = paidFirst
    ? "/onboarding?paid=1"
    : requestedPlan
    ? `/onboarding?plan=${requestedPlan}${trialOffer ? "&offer=trial" : ""}`
    : "/onboarding";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Unticked by default. Only recorded (and sent to Loops) after the email is confirmed.
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, ...(marketingOptIn ? { marketing_opt_in: true, marketing_opt_in_at: new Date().toISOString() } : {}) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(onboardingPath)}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user with no session.
    if (data.user && !data.session) {
      setNeedsVerification(true);
      return;
    }

    router.push(onboardingPath);
    router.refresh();
  }

  if (needsVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-bg px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-base-border bg-base-card p-8">
            <h1 className="text-xl font-semibold text-ink-primary">Check your email</h1>
            <p className="mt-2 text-sm text-ink-secondary">
              We sent a verification link to <span className="text-ink-primary">{email}</span>.
              Confirm your email to finish creating your account.
            </p>
            {paidFirst && (
              <p className="mt-3 text-sm text-ink-secondary">
                Your plan activates as soon as you confirm — as long as this is the email you used at checkout.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-base-border bg-base-card p-8">
          <h1 className="text-xl font-semibold text-ink-primary">Create your account</h1>
          <p className="mt-1 text-sm text-ink-secondary">Start creating better ads today.</p>
          {paidFirst && (
            <p className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-ink-secondary">
              <span className="font-medium text-ink-primary">Use the same email you paid with.</span> That&apos;s how
              we attach your plan to your new account.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-ink-secondary">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
                placeholder="Max Ostaficiuc"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-ink-secondary">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-ink-secondary">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-base-border bg-base-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
                placeholder="At least 8 characters"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-ink-secondary">
              <input
                type="checkbox"
                name="marketingOptIn"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-base-border bg-base-surface accent-[#8b5cf6]"
              />
              <span>{CONSENT_TEXT.signup}</span>
            </label>

            {error && <p className="text-sm text-accent-red">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Get Started"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-secondary">
            Already have an account?{" "}
            <a
              href={trialOffer ? `/login?next=${encodeURIComponent("/onboarding?plan=Starter&offer=trial")}` : "/login"}
              className="text-brand-light hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
