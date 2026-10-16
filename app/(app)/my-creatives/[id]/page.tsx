import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { getConnectedAdAccount } from "@/lib/meta/client";
import { AppShell } from "@/components/dashboard/AppShell";
import { CreativeReportView } from "@/components/marketing/CreativeReportView";
import { GeneratedCreativeView } from "@/components/strategy/GeneratedCreativeView";
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

  // Only a yes/no reaches the browser — never the account or its token.
  const adAccountConnected = !!(await getConnectedAdAccount(supabase, user.id).catch(() => null));

  return (
    <AppShell profile={profile ?? null} greeting="Creative Report" subtitle="">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/my-creatives"
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft size={14} /> Back to My Creatives
        </Link>

        {creative.source === "generated" ? (
          <GeneratedCreativeView creative={creative} />
        ) : creative.is_simulated ? (
          // Saved before real video analysis existed: a placeholder, not an analysis of this file.
          // Its score and text were never real, so none of it is shown.
          <div role="status" className="rounded-2xl border border-base-border bg-base-card p-6">
            <p className="text-sm font-medium text-ink-primary">This file was not analyzed.</p>
            <p className="mt-1.5 text-sm text-ink-secondary">
              It was saved as a placeholder before {creative.file_type === "video" ? "video" : "this type of"} analysis was available, so there is no real report or score for it. No credits were used.
            </p>
            <Link href="/analyze" className="mt-4 inline-flex text-sm font-medium text-brand-light hover:underline">
              Analyze it again →
            </Link>
          </div>
        ) : creative.report ? (
          <CreativeReportView
            report={creative.report}
            imageUrl={creative.file_url}
            isSimulated={creative.is_simulated}
            reportId={creative.id}
            adAccountConnected={adAccountConnected}
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
