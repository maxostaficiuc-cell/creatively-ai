"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-base-border bg-base-card p-8">
          {sent ? (
            <>
              <h1 className="text-xl font-semibold text-ink-primary">Check your email</h1>
              <p className="mt-2 text-sm text-ink-secondary">
                If an account exists for {email}, a password reset link is on its way.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-ink-primary">Reset your password</h1>
              <p className="mt-1 text-sm text-ink-secondary">
                We&apos;ll email you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                {error && <p className="text-sm text-accent-red">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-sm text-ink-secondary">
            <a href="/login" className="text-brand-light hover:underline">
              Back to login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
