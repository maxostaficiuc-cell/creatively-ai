import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = { title: "Account suspended — Creatively.ai", robots: { index: false, follow: false } };

const SUPPORT_EMAIL = "trycreatively.ai@gmail.com";

/** Where the middleware sends a signed-in account whose access an admin has suspended. */
export default function AccountSuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-base-border bg-base-card p-8">
          <h1 className="text-xl font-semibold text-ink-primary">Account access is paused</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            Access to the Creatively.ai app is currently suspended for this account. Your data has not been deleted.
            If you think this is a mistake, contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-light hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            Your subscription is managed separately. You can still{" "}
            <Link href="/billing" className="text-brand-light hover:underline">
              view or cancel it on the billing page
            </Link>
            .
          </p>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
