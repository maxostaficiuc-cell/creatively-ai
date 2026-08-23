import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const failed = searchParams.status === "error";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-bg px-6 text-center">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
          failed ? "bg-accent-red/10 text-accent-red" : "bg-accent-green/10 text-accent-green"
        }`}
      >
        {failed ? <XCircle size={26} /> : <CheckCircle2 size={26} />}
      </div>

      {failed ? (
        <>
          <h1 className="text-xl font-semibold text-ink-primary">Payment didn&apos;t go through</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-secondary">
            No charge was made. You can try again anytime from Billing.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-ink-primary">Thanks — payment received</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-secondary">
            Your plan will update within a few seconds. Check your email for a receipt.
          </p>
        </>
      )}

      <Link
        href="/billing"
        className="mt-7 rounded-xl bg-gradient-to-b from-brand-light to-brand px-6 py-3 text-sm font-medium text-white shadow-glow hover:brightness-110"
      >
        Back to Billing
      </Link>
    </div>
  );
}
