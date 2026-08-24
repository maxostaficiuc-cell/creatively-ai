"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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

    router.push("/onboarding");
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

            {error && <p className="text-sm text-accent-red">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Get Started"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-secondary">
            Already have an account?{" "}
            <a href="/login" className="text-brand-light hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
