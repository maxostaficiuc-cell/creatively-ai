import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { getConnectedAdAccount, fetchMetaCampaigns } from "@/lib/meta/client";
import { AppShell } from "@/components/dashboard/AppShell";
import { ConnectAdAccountEmptyState } from "@/components/dashboard/ConnectAdAccountEmptyState";

type Row = { id: string; name?: string; status?: string };

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);
  if (!profile) redirect("/login");

  const account = await getConnectedAdAccount(supabase, user.id);

  let rows: Row[] = [];
  let fetchError: string | null = null;

  if (account?.access_token && account.external_account_id) {
    try {
      rows = (await fetchMetaCampaigns(account.access_token, account.external_account_id)) as Row[];
    } catch {
      fetchError = "Couldn't load data from Meta — your connection may need to be refreshed.";
    }
  }

  return (
    <AppShell profile={profile} greeting="Campaigns" subtitle="">
      {!account ? (
        <ConnectAdAccountEmptyState />
      ) : fetchError ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-accent-red/30 bg-accent-red/5 p-6 text-center text-sm text-accent-red">
          {fetchError}
        </div>
      ) : rows.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-10 text-center text-sm text-ink-secondary">
          No campaigns found on your connected Meta account yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-base-border bg-base-card p-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Campaigns</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-ink-primary">{r.name ?? r.id}</td>
                  <td className="px-4 py-3 text-ink-secondary">{r.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
