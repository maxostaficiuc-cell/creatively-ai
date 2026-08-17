import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/AppShell";
import { AnalyzeClient } from "./AnalyzeClient";
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
    <AppShell profile={profile ?? null} greeting="Analyze Creative" subtitle="">
      <AnalyzeClient credits={profile?.ai_credits ?? 0} />
    </AppShell>
  );
}
