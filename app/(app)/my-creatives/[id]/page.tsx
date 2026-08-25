import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { CreativeReportView } from "@/components/marketing/CreativeReportView";
import type { Creative } from "@/lib/types";

export default async function CreativeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);

  // RLS already scopes this to the logged-in user's own rows — a user
  // cannot fetch someone else's creative by guessing an id.
  const { data: creative } = await supabase
    .from("creatives")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single<Creative>();

  if (!creative) notFound();

  return (
    <AppShell profile={profile ?? null} greeting="Creative Report" subtitle="">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/my-creatives"
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft size={14} /> Back to My Creatives
        </Link>

        {creative.report ? (
          <CreativeReportView
            report={creative.report}
            imageUrl={creative.file_url}
            isSimulated={creative.is_simulated}
          />
        ) : (
          <div className="rounded-2xl border border-base-border bg-base-card p-6">
            <p className="text-sm text-ink-secondary">
              This creative was analyzed before the detailed report existed, so only a summary is
              available.
            </p>
            <div className="mt-4 grid gap-2 text-sm text-ink-secondary sm:grid-cols-3">
              <p><span className="text-accent-green">Working:</span> {creative.whats_working}</p>
              <p><span className="text-accent-red">Not working:</span> {creative.whats_not}</p>
              <p><span className="text-brand-light">Test next:</span> {creative.what_to_test}</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
