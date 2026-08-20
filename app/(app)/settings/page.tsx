import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { SettingsClient } from "./SettingsClient";

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);

  if (!profile) redirect("/login");

  return (
    <AppShell profile={profile} greeting="Settings" subtitle="">
      <SettingsClient profile={profile} />
    </AppShell>
  );
}
