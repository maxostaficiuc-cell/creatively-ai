import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { getConnectedAdAccount, fetchMetaInsights } from "@/lib/meta/client";
import { AppShell } from "@/components/dashboard/AppShell";
import { ConnectAdAccountEmptyState } from "@/components/dashboard/ConnectAdAccountEmptyState";

type InsightRow = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
};

export default async function InsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);
  if (!profile) redirect("/login");

  const account = await getConnectedAdAccount(supabase, user.id);

  let rows: InsightRow[] = [];
  let fetchError: string | null = null;

  if (account?.access_token && account.external_account_id) {
    try {
      rows = (await fetchMetaInsights(account.access_token, account.external_account_id)) as InsightRow[];
    } catch {
      fetchError = "Couldn't load insights from Meta — your connection may need to be refreshed.";
    }
  }

  const totals = rows[0];

  return (
    <AppShell profile={profile} greeting="Insights" subtitle="">
      {!account ? (
        <ConnectAdAccountEmptyState />
      ) : fetchError ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-accent-red/30 bg-accent-red/5 p-6 text-center text-sm text-accent-red">
          {fetchError}
        </div>
      ) : !totals ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-10 text-center text-sm text-ink-secondary">
          No insights available yet for your connected Meta account.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Spend", value: totals.spend ? `$${totals.spend}` : "—" },
            { label: "Impressions", value: totals.impressions ?? "—" },
            { label: "Clicks", value: totals.clicks ?? "—" },
            { label: "CTR", value: totals.ctr ? `${totals.ctr}%` : "—" },
            { label: "CPC", value: totals.cpc ? `$${totals.cpc}` : "—" },
            { label: "CPM", value: totals.cpm ? `$${totals.cpm}` : "—" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-base-border bg-base-card p-5">
              <p className="text-xs text-ink-muted">{m.label}</p>
              <p className="mt-2 text-xl font-semibold text-ink-primary">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
