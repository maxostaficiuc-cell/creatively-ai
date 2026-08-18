import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/AppShell";
import { BillingClient } from "./BillingClient";
import type { Profile } from "@/lib/types";

export default async function BillingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

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
