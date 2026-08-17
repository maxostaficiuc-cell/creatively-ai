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
    <AppShell profile={profile ?? null} greeting="Ads" subtitle="">
      <PlaceholderPage
        title="Ads"
        description="Individual ad performance will appear here after you connect an ad account."
      />
    </AppShell>
  );
}
