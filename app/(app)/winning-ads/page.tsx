import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { loadLibrary, parseFilters } from "@/lib/libraryServer";

export const dynamic = "force-dynamic";

export default async function WinningAdsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);
  const filters = parseFilters(searchParams);
  const result = await loadLibrary(supabase, user.id, filters);

  return (
    <AppShell profile={profile ?? null} greeting="Winning Ads" subtitle="Curated ad creatives to study, save and borrow ideas from.">
      <LibraryBrowser result={result} filters={filters} />
    </AppShell>
  );
}
