import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { isMetaConfigured } from "@/lib/meta/client";
import { AppShell } from "@/components/dashboard/AppShell";
import { CheckCircle2, Facebook, Music2, Search } from "lucide-react";
import type { AdAccount } from "@/lib/types";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);
  if (!profile) redirect("/login");

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", user.id)
    .returns<AdAccount[]>();

  const metaAccount = accounts?.find((a) => a.platform === "meta" && a.status === "connected");
  const metaConfigured = isMetaConfigured();

  return (
    <AppShell profile={profile} greeting="Ad Accounts" subtitle="Connect your advertising platforms.">
      <div className="mx-auto max-w-3xl space-y-6">
        {searchParams.error === "meta_not_configured" && (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
            Meta isn&apos;t configured yet on this deployment. An admin needs to add META_APP_ID and
            META_APP_SECRET before accounts can connect.
          </div>
        )}
        {searchParams.error === "meta_connect_failed" && (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
            Connecting your Meta account didn&apos;t work. Please try again.
          </div>
        )}
        {searchParams.connected === "meta" && (
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/5 p-4 text-sm text-accent-green">
            Meta Ads connected successfully.
          </div>
        )}

        {/* Meta — primary, functional */}
        <div className="rounded-2xl border border-brand/40 bg-base-card p-6 shadow-glow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1877F2]/15 text-[#1877F2]">
                <Facebook size={22} />
              </div>
              <div>
                <h3 className="font-medium text-ink-primary">Meta Ads</h3>
                <p className="text-sm text-ink-secondary">Facebook &amp; Instagram advertising</p>
              </div>
            </div>
            {metaAccount ? (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1.5 text-xs text-accent-green">
                <CheckCircle2 size={13} /> Connected
              </span>
            ) : null}
          </div>

          {metaAccount ? (
            <div className="mt-5 rounded-xl border border-base-border bg-base-surface p-4 text-sm text-ink-secondary">
              Connected account: <span className="text-ink-primary">{metaAccount.account_name}</span>
            </div>
          ) : (
            <a
              href={metaConfigured ? "/api/meta/connect" : undefined}
              aria-disabled={!metaConfigured}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all ${
                metaConfigured
                  ? "bg-gradient-to-b from-brand-light to-brand text-white shadow-glow hover:brightness-110"
                  : "cursor-not-allowed border border-base-border text-ink-muted"
              }`}
            >
              {metaConfigured ? "Connect Meta Ads" : "Meta Ads — setup required"}
            </a>
          )}
          {!metaConfigured && !metaAccount && (
            <p className="mt-3 text-xs text-ink-muted">
              This deployment doesn&apos;t have Meta API credentials configured yet.
            </p>
          )}
        </div>

        {/* TikTok — coming soon */}
        <div className="rounded-2xl border border-base-border bg-base-card p-6 opacity-60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-surface text-ink-muted">
                <Music2 size={22} />
              </div>
              <div>
                <h3 className="font-medium text-ink-primary">TikTok Ads</h3>
                <p className="text-sm text-ink-secondary">Coming soon</p>
              </div>
            </div>
            <span className="rounded-full border border-base-border px-3 py-1.5 text-xs text-ink-muted">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Google — coming soon */}
        <div className="rounded-2xl border border-base-border bg-base-card p-6 opacity-60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-surface text-ink-muted">
                <Search size={22} />
              </div>
              <div>
                <h3 className="font-medium text-ink-primary">Google Ads</h3>
                <p className="text-sm text-ink-secondary">Coming soon</p>
              </div>
            </div>
            <span className="rounded-full border border-base-border px-3 py-1.5 text-xs text-ink-muted">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
