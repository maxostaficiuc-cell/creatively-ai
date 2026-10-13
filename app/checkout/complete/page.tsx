import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckoutStatusPoller } from "./CheckoutStatusPoller";

// This page used to show "Thanks — payment received" unconditionally,
// regardless of whether the payment actually succeeded — trusting the
// redirect itself as proof. It never was. The redirect only tells us the
// user finished (or left) the Whop checkout flow; it says nothing about
// whether the payment succeeded. The only thing that can say that is the
// verified Whop webhook writing subscription_status = 'active' to this
// user's row, which is exactly what CheckoutStatusPoller waits for.
export default async function CheckoutCompletePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Paid first ($1 trial, Pro or Business) → no account yet. We can't (and don't) claim the
  // payment succeeded here; the verified webhook decides that. We just explain
  // the next step: create the account with the email used at checkout.
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base-bg px-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-light/85">One last step</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-primary">Create your Creatively.ai account</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
          Sign up with <span className="font-medium text-ink-primary">the same email you used at checkout</span>.
          Your plan is attached to that email and activates as soon as you confirm it. If you close this page,
          you can come back and sign up later without paying again.
        </p>
        <Link
          href="/signup?paid=1"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-gradient-to-b from-brand-light to-brand px-7 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          Create my account
        </Link>
        <p className="mt-4 text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login?next=%2Fcheckout%2Fcomplete" className="text-brand-light hover:underline">
            Log in
          </Link>
        </p>
        <p className="mt-10 max-w-sm text-xs leading-relaxed text-ink-muted">
          Didn&apos;t finish paying? You can start again any time from the homepage. Used a different email at
          checkout? Contact us at{" "}
          <a href="mailto:trycreatively.ai@gmail.com" className="text-ink-secondary hover:underline">
            trycreatively.ai@gmail.com
          </a>
          .
        </p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const initiallyActive = profile?.subscription_status === "active";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-bg px-6 text-center">
      <CheckoutStatusPoller initiallyActive={initiallyActive} />
    </div>
  );
}
