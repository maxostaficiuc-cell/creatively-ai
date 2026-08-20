import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
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
      <BillingClient profile={profile} />
    </AppShell>
  );
}
