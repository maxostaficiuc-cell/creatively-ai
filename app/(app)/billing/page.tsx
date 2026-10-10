import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { BillingClient } from "./BillingClient";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { error?: string; detail?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);

  if (!profile) redirect("/login");

  return (
    <AppShell
      profile={profile}
      greeting="Billing"
      subtitle="Manage your plan, AI credits, and subscription."
    >
      {searchParams.error && (
        <div className="mx-auto mb-6 max-w-6xl rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
          <p className="font-medium">Checkout error: {searchParams.error}</p>
          {searchParams.detail && (
            <p className="mt-1 text-xs opacity-90">{searchParams.detail}</p>
          )}
        </div>
      )}
      <BillingClient profile={profile} />
    </AppShell>
  );
}
