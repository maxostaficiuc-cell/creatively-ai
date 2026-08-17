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
    <AppShell profile={profile ?? null} greeting="Winning Ads" subtitle="">
      <PlaceholderPage
        title="Winning Ads"
        description="Browse a library of winning ads across industries and platforms. Coming soon."
      />
    </AppShell>
  );
}
