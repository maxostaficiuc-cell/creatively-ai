import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { AnalyzeClient } from "./AnalyzeClient";

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);

  return (
    <AppShell profile={profile ?? null} greeting="Analyze Creative" subtitle="">
      <AnalyzeClient credits={profile?.ai_credits ?? 0} />
    </AppShell>
  );
}
