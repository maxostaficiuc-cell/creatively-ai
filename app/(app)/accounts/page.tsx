import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { getIntegrations } from "@/lib/integrations";
import { getRewardState } from "@/lib/rewards";
import { AppShell } from "@/components/dashboard/AppShell";
import { EarlyRewardCard } from "@/components/dashboard/EarlyRewardCard";
import { CheckCircle2, Facebook, Music2, Search, Lock, BarChart3 } from "lucide-react";
import type { AdAccount } from "@/lib/types";

// Ad Performance — integration status + the early-customer reward.
// Nothing on this page is sample data: statuses come from configuration and the
// user's real ad_accounts rows; the reward state comes from reward_grants.

const ICONS = { meta: Facebook, tiktok: Music2, google: Search } as const;
const METRICS = ["Spend", "Impressions", "Clicks", "CTR", "Conversions", "ROAS"];

export default async function AdPerformancePage({
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

  const integrations = getIntegrations();
  const reward = await getRewardState(supabase, user.id);
  const anyLive = integrations.some((i) => i.status === "available");
  const connected = (id: string) => accounts?.find((a) => a.platform === id && a.status === "connected") ?? null;

  return (
    <AppShell
      profile={profile}
      greeting="Ad Performance"
      subtitle="Connect your advertising accounts to bring campaign performance data into Creatively.ai. Account integrations are coming soon."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {searchParams.error === "meta_connect_failed" && (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
            Connecting your Meta account didn&apos;t work. Please try again.
          </div>
        )}
        {searchParams.connected === "meta" && (
          <div className="rounded-xl border border-accent-green/30 bg-accent-green/5 p-4 text-sm text-accent-green">Meta Ads connected successfully.</div>
        )}

        <div className="ov-reveal flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-base-border bg-base-card px-3 py-1.5 text-xs text-ink-secondary">
            <span className={`h-1.5 w-1.5 rounded-full ${anyLive ? "bg-accent-green" : "bg-brand-light ap-pulse"}`} />
            Account integrations — {anyLive ? "Available" : "Coming soon"}
          </span>
          <span className="text-xs text-ink-muted">No campaign data is imported until you connect a live integration.</span>
        </div>

        <EarlyRewardCard reward={reward} isPaying={profile.subscription_status === "active"} balance={profile.ai_credits} />

        <section aria-labelledby="ap-integrations" className="ov-reveal" style={{ animationDelay: "120ms" }}>
          <h2 id="ap-integrations" className="font-medium text-ink-primary">
            Integrations
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {integrations.map((i) => {
              const Icon = ICONS[i.id];
              const acct = connected(i.id);
              return (
                <div key={i.id} className="flex flex-col rounded-2xl border border-base-border bg-base-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-base-surface text-ink-secondary">
                      <Icon size={18} />
                    </div>
                    {acct ? (
                      <span className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2.5 py-1 text-[11px] text-accent-green">
                        <CheckCircle2 size={12} /> Connected
                      </span>
                    ) : (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${
                          i.status === "available" ? "border-accent-green/30 text-accent-green" : "border-base-border text-ink-muted"
                        }`}
                      >
                        {i.status === "available" ? "Available" : "Coming soon"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-ink-primary">{i.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">{i.description}</p>
                  <div className="mt-5 flex-1" />
                  {acct ? (
                    <p className="rounded-xl border border-base-border bg-base-surface px-3 py-2 text-xs text-ink-secondary">
                      {acct.account_name ?? "Connected account"}
                    </p>
                  ) : i.status === "available" && i.connectHref ? (
                    <a
                      href={i.connectHref}
                      className="flex items-center justify-center rounded-xl bg-gradient-to-b from-brand-light to-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow hover:brightness-110"
                    >
                      Connect {i.name}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-base-border px-4 py-2.5 text-sm text-ink-muted"
                    >
                      <Lock size={13} /> Not available yet
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="ov-reveal rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-6" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start gap-3">
            <BarChart3 size={18} className="mt-0.5 shrink-0 text-brand-light" />
            <div>
              <h2 className="text-sm font-medium text-ink-primary">What will appear here</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Once an account is connected, this page shows the real numbers imported from it. Until then it stays empty — we
                never show sample figures as if they were yours.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {METRICS.map((m) => (
                  <span key={m} className="rounded-md border border-base-border px-2 py-1 text-xs text-ink-muted">
                    {m}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                In the meantime, your creative scores and improvement ideas are on the{" "}
                <Link href="/dashboard" className="text-brand-light hover:underline">
                  Overview
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
