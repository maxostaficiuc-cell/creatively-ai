import Link from "next/link";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, MousePointerClick, Users, ArrowRight, Sparkles, FolderOpen, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { getConnectedAdAccount, fetchMetaInsights } from "@/lib/meta/client";
import { AppShell } from "@/components/dashboard/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentAnalysesGrid } from "@/components/dashboard/RecentAnalysesGrid";
import { CreativePerformanceChart } from "@/components/dashboard/CreativePerformanceChart";
import { CreativeHealthSection } from "@/components/overview/CreativeHealthSection";
import { OpportunitiesSection } from "@/components/overview/OpportunitiesSection";
import { NextActionCard } from "@/components/overview/NextActionCard";
import { PrinciplesSection } from "@/components/overview/PrinciplesSection";
import { computeCreativeHealth } from "@/lib/creativeHealth";
import { loadScoreHistory } from "@/lib/scoreHistory";
import { findOpportunities, healthStats, nextAction, principlesFor, realAnalyses, type Analysis } from "@/lib/overviewInsights";
import type { AdAccount, Creative } from "@/lib/types";

// Overview: a summary of the user's own analyzed creatives — quality, recurring
// issues and the most useful next step. Every number and finding comes from
// their saved analyses (public.creatives). Campaign metrics only appear when a
// real ad account is connected; otherwise we link to Ad Performance.

type DashboardMetrics = { spend?: string; ctr?: string; clicks?: string; cpm?: string } | null;

async function getDashboardMetrics(metaAccount: AdAccount | null): Promise<DashboardMetrics> {
  if (!metaAccount?.access_token || !metaAccount.external_account_id) return null;
  try {
    const insights = await fetchMetaInsights(metaAccount.access_token, metaAccount.external_account_id);
    return (insights?.[0] as DashboardMetrics) ?? null;
  } catch {
    return null;
  }
}

const ANALYSIS_COLUMNS = "id, score, summary, created_at, file_type, file_url, platform, is_simulated, report";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);
  const firstName = (profile?.full_name || "").trim().split(" ")[0];

  const [metaAccount, history, recentRes, countRes] = await Promise.all([
    getConnectedAdAccount(supabase, user.id),
    loadScoreHistory(supabase, user.id),
    // The latest 200 analyses drive health, opportunities and recommendations.
    supabase.from("creatives").select(ANALYSIS_COLUMNS).eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
    supabase.from("creatives").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const metrics = await getDashboardMetrics(metaAccount);

  const loadFailed = !!recentRes.error;
  const rows = (recentRes.data ?? []) as Analysis[];
  const analyses = realAnalyses(rows);
  const totalSaved = countRes.count ?? rows.length;

  const health = {
    "30D": healthStats(analyses, "30D"),
    ALL: healthStats(analyses, "ALL"),
  };
  const now = Date.now();
  const signals = {
    "30D": computeCreativeHealth(analyses.filter((a) => now - Date.parse(a.created_at) <= 30 * 86_400_000) as Creative[]),
    ALL: computeCreativeHealth(analyses as Creative[]),
  };
  const opportunities = findOpportunities(analyses);
  const next = nextAction(analyses, opportunities);
  const principles = principlesFor(opportunities);

  return (
    <AppShell
      profile={profile}
      greeting={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      subtitle="How your analyzed creatives are doing, what keeps coming up, and what to fix next."
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* primary actions */}
        <div className="ov-reveal flex flex-wrap items-center gap-3">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-[filter,transform] hover:-translate-y-px hover:brightness-110"
          >
            <Sparkles size={15} /> Analyze Creative
          </Link>
          <Link
            href="/my-creatives"
            className="inline-flex items-center gap-2 rounded-xl border border-base-border bg-base-card px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:border-brand/40 hover:text-ink-primary"
          >
            <FolderOpen size={15} /> My Creatives
            {totalSaved > 0 && <span className="text-xs tabular-nums text-ink-muted">{totalSaved}</span>}
          </Link>
        </div>

        {loadFailed ? (
          <div role="alert" className="rounded-2xl border border-accent-red/30 bg-accent-red/5 p-5 text-sm text-ink-primary">
            Your analyses couldn&apos;t be loaded right now. They&apos;re safe — please refresh the page.
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CreativeHealthSection health={health} signals={signals} />
              </div>
              <div className="lg:col-span-2">
                <NextActionCard action={next} />
              </div>
            </div>

            <OpportunitiesSection opportunities={opportunities} analysesCount={analyses.length} />

            <CreativePerformanceChart points={history.points} error={history.error} />

            <section className="ov-reveal" style={{ animationDelay: "80ms" }}>
              <RecentAnalysesGrid creatives={analyses.slice(0, 6) as Creative[]} />
            </section>

            <PrinciplesSection principles={principles} />
          </>
        )}

        {/* campaign data: only real, connected numbers — otherwise point to Ad Performance */}
        {metaAccount && metrics ? (
          <section className="ov-reveal">
            <h2 className="font-medium text-ink-primary">Campaign performance</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={DollarSign} label="Ad Spend" value={metrics.spend ? `$${metrics.spend}` : "—"} />
              <MetricCard icon={TrendingUp} label="CTR" value={metrics.ctr ? `${metrics.ctr}%` : "—"} />
              <MetricCard icon={MousePointerClick} label="Clicks" value={metrics.clicks ?? "—"} />
              <MetricCard icon={Users} label="CPM" value={metrics.cpm ? `$${metrics.cpm}` : "—"} />
            </div>
          </section>
        ) : (
          <Link
            href="/accounts"
            className="ov-reveal group flex items-center justify-between gap-4 rounded-2xl border border-base-border bg-base-card p-5 transition-colors hover:border-brand/30"
          >
            <div className="flex items-start gap-3">
              <BarChart3 size={18} className="mt-0.5 shrink-0 text-brand-light" />
              <div>
                <p className="text-sm font-medium text-ink-primary">Campaign data isn&apos;t connected</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Spend, CTR and ROAS will appear once ad-account integrations launch. Early customers get 10,000 bonus credits.
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm text-brand-light">
              Ad Performance <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        <a
          href="/contact"
          className="group flex items-center justify-between rounded-2xl border border-base-border bg-base-card p-5 transition-colors hover:border-brand/30"
        >
          <div>
            <p className="text-sm font-medium text-ink-primary">Need help?</p>
            <p className="mt-1 text-xs text-ink-secondary">
              Have a question or need assistance? Send us a message and we&apos;ll get back to you as quickly as possible. We typically
              reply within 1 hour.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 pl-4 text-sm text-brand-light">
            Contact Support
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
      </div>
    </AppShell>
  );
}
