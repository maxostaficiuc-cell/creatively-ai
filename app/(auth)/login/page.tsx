"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trialHref } from "@/lib/starterTrial";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, FormError, PasswordField, SubmitButton } from "@/components/auth/fields";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const next = searchParams.get("next") || "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-primary">Welcome back</h1>
      <p className="mt-2 text-[15px] text-ink-secondary">Log in to your Creatively.ai account.</p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          aside={
            <a href="/forgot-password" className="text-xs font-medium text-brand-light hover:underline">
              Forgot password?
            </a>
          }
        />

        {error && <FormError>{error}</FormError>}

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Logging in…">
            Log In
          </SubmitButton>
        </div>
      </form>

      <p className="mt-8 border-t border-base-border pt-6 text-sm text-ink-secondary">
        Don&apos;t have an account?{" "}
        {/* Same route every "Try for $1" button uses: logged-out visitors go
            straight to the existing Whop $1 Starter checkout. */}
        <a href={trialHref("login")} className="text-brand-light hover:underline">
          Try now for $1
        </a>
      </p>
    </AuthShell>
  );
}
