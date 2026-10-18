"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Info, Lock, Mail, MailCheck, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CONSENT_TEXT } from "@/lib/consentText";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, FormError, PasswordField, SubmitButton } from "@/components/auth/fields";

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
      <AuthShell>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/[0.1] text-brand-light shadow-glow">
          <MailCheck aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="mt-7 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-primary">Check your email</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary" role="status">
          We sent a verification link to <span className="font-medium text-ink-primary">{email}</span>.
          Confirm your email to finish creating your account.
        </p>
        {paidFirst && (
          <p className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.07] px-4 py-3 text-sm leading-relaxed text-ink-secondary">
            Your plan activates as soon as you confirm — as long as this is the email you used at checkout.
          </p>
        )}
      </AuthShell>
    );
  }

  const longEnough = password.length >= 8;

  return (
    <AuthShell>
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-primary">Create your account</h1>
      <p className="mt-2 text-[15px] text-ink-secondary">Start creating better ads today.</p>
      {paidFirst && (
        <p className="mt-5 flex gap-3 rounded-xl border border-brand/30 bg-brand/[0.07] px-4 py-3 text-[13px] leading-relaxed text-ink-secondary">
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" />
          <span>
            <span className="font-medium text-ink-primary">Use the same email you paid with.</span> That&apos;s how we
            attach your plan to your new account.
          </span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field
          id="fullName"
          label="Full name"
          icon={User}
          type="text"
          name="name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Max Ostaficiuc"
        />
        <Field
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
        <PasswordField
          id="password"
          label="Password"
          icon={Lock}
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          aria-describedby="password-rule"
          hint={
            <p
              id="password-rule"
              className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
                longEnough ? "text-accent-green" : "text-ink-muted"
              }`}
            >
              <Check aria-hidden className={`h-3.5 w-3.5 transition-opacity ${longEnough ? "opacity-100" : "opacity-40"}`} />
              At least 8 characters
            </p>
          }
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-border bg-base-surface/60 px-3.5 py-3 text-xs leading-relaxed text-ink-secondary transition-colors hover:border-[#34343c] has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.06] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50">
          <input
            type="checkbox"
            name="marketingOptIn"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-base-border bg-base-surface accent-[#8b5cf6] focus:outline-none"
          />
          <span>{CONSENT_TEXT.signup}</span>
        </label>

        {error && <FormError>{error}</FormError>}

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Creating account…">
            Get Started
          </SubmitButton>
        </div>
      </form>

      <p className="mt-8 border-t border-base-border pt-6 text-sm text-ink-secondary">
        Already have an account?{" "}
        <a
          href={trialOffer ? `/login?next=${encodeURIComponent("/onboarding?plan=Starter&offer=trial")}` : "/login"}
          className="text-brand-light hover:underline"
        >
          Log in
        </a>
      </p>
    </AuthShell>
  );
}
