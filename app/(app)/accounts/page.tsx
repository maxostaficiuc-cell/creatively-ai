import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/AppShell";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";
import type { Profile } from "@/lib/types";

export default async function Page() {
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

  return (
    <AppShell profile={profile ?? null} greeting="Ad Accounts" subtitle="">
      <PlaceholderPage
        title="Ad Accounts"
        description="Connect Meta, TikTok or Google Ads to bring real performance data into Creatively.ai."
      />
    </AppShell>
  );
}
