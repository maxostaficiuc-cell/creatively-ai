import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, MousePointerClick, Users, TrendingUp as ScaleIcon, TrendingDown as ReviewIcon, Sparkles, Sparkles as TestIcon, Upload, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { getConnectedAdAccount, fetchMetaInsights } from "@/lib/meta/client";
import { AppShell } from "@/components/dashboard/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { CreativeInsightCard } from "@/components/dashboard/CreativeInsightCard";
import { RecentAnalysisTable } from "@/components/dashboard/RecentAnalysisTable";
import { AccountStatusCard } from "@/components/dashboard/AccountStatusCard";
import { CreativeThumb } from "@/components/dashboard/CreativeThumb";
import { CreativeHealthCard } from "@/components/dashboard/CreativeHealthCard";
import { NextMoveCard } from "@/components/dashboard/NextMoveCard";
import { CreativePortfolioStats } from "@/components/dashboard/CreativePortfolioStats";
import { RecentAnalysesGrid } from "@/components/dashboard/RecentAnalysesGrid";
import { CreativePerformanceChart } from "@/components/dashboard/CreativePerformanceChart";
import { computeCreativeHealth, getNextMoveRecommendation } from "@/lib/creativeHealth";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { Creative, AdAccount } from "@/lib/types";

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);
  const firstName = (profile?.full_name || user.email || "there").split(" ")[0];

  const metaAccount = await getConnectedAdAccount(supabase, user.id);
  const metrics = await getDashboardMetrics(metaAccount);

  const { data: creatives } = await supabase
    .from("creatives")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Creative[]>();

  const list = creatives ?? [];
  const creativeHealth = computeCreativeHealth(list);
  const nextMove = creativeHealth ? getNextMoveRecommendation(creativeHealth) : null;
  const scoredCreatives = list.filter((c) => c.score !== null);
  const portfolioStats = {
    creativesAnalyzed: list.length,
    averageScore:
      scoredCreatives.length > 0
        ? Math.round(scoredCreatives.reduce((sum, c) => sum + (c.score ?? 0), 0) / scoredCreatives.length)
        : null,
    winningCreatives: list.filter((c) => (c.score ?? 0) >= 80).length,
    needsImprovement: list.filter((c) => (c.score ?? 0) < 60).length,
  };
  const toScale = list.filter((c) => (c.score ?? 0) >= 80).length;
  const toReview = list.filter((c) => (c.score ?? 0) < 60).length;
  const topCreatives = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
  const recentRows = list.slice(0, 5).map((c) => ({
    creative: c.summary || (c.file_type === "video" ? "Video creative" : "Image creative"),
    platform: c.platform || "—",
    score: c.score ?? 0,
    insight: c.what_to_test || "—",
    date: new Date(c.created_at).toLocaleDateString(),
  }));

  const accounts = [
    { name: "Meta Ads", connected: !!metaAccount },
    { name: "TikTok Ads", connected: false },
    { name: "Google Ads", connected: false },
  ];

  return (
    <AppShell
      profile={profile}
      greeting={`${getGreeting()}, ${firstName}. 👋`}
      subtitle="Here's what's happening with your advertising."
    >
      <div className="space-y-6">
        <CreativeHealthCard health={creativeHealth} />
        <NextMoveCard recommendation={nextMove} />
        <CreativePortfolioStats stats={portfolioStats} />
        <RecentAnalysesGrid creatives={list.slice(0, 6)} />
        <CreativePerformanceChart creatives={list} />

        {metaAccount && metrics ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={DollarSign} label="Ad Spend" value={metrics.spend ? `$${metrics.spend}` : "—"} />
            <MetricCard icon={TrendingUp} label="CTR" value={metrics.ctr ? `${metrics.ctr}%` : "—"} />
            <MetricCard icon={MousePointerClick} label="Clicks" value={metrics.clicks ?? "—"} />
            <MetricCard icon={Users} label="CPM" value={metrics.cpm ? `$${metrics.cpm}` : "—"} />
          </div>
        ) : (
          <EmptyState
            title="Connect your advertising account"
            description="Connect Meta, TikTok or Google Ads to unlock real performance intelligence."
            action={<ButtonLink href="/accounts">Connect Account</ButtonLink>}
          />
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/15 via-base-card to-base-card p-6 xl:col-span-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-ink-primary">Analyze a Creative</h3>
              <Sparkles className="text-brand-light" size={16} />
            </div>
            <p className="mt-2 text-sm text-ink-secondary">
              Upload an ad and get AI-powered analysis on what&apos;s working, what&apos;s not, and
              what to test next.
            </p>
            <ButtonLink href="/analyze" className="mt-5">
              Analyze Creative <Sparkles size={14} />
            </ButtonLink>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-border bg-base-surface/60 py-8 text-center">
              <Upload size={20} className="text-brand-light" />
              <p className="text-xs text-ink-secondary">
                Drag and drop an image or video
                <br />
                or click to upload
              </p>
            </div>
          </div>

          <div className="xl:col-span-3">
            <PerformanceChart data={null} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="rounded-2xl border border-base-border bg-base-card p-6 xl:col-span-2">
            <h3 className="font-medium text-ink-primary">Creative Intelligence</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              AI insights based on your creative performance
            </p>
            <div className="mt-4 space-y-3">
              <CreativeInsightCard
                icon={ScaleIcon}
                tone="green"
                title="Creatives to Scale"
                description={
                  toScale > 0
                    ? `${toScale} creative${toScale === 1 ? "" : "s"} scoring 80+ — strong performers worth scaling.`
                    : "Once you have analyzed creatives, top performers will surface here."
                }
                href="/my-creatives"
              />
              <CreativeInsightCard
                icon={ReviewIcon}
                tone="red"
                title="Creatives to Review"
                description={
                  toReview > 0
                    ? `${toReview} creative${toReview === 1 ? "" : "s"} scoring under 60 — worth a closer look.`
                    : "Underperforming creatives consuming spend will be flagged here."
                }
                href="/my-creatives"
              />
              <CreativeInsightCard
                icon={TestIcon}
                tone="purple"
                title="Tests Worth Running"
                description="AI-identified testing opportunities will appear here."
                href="/insights"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-base-border bg-base-card p-6 xl:col-span-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-ink-primary">Top Performing Creatives</h3>
              <a href="/my-creatives" className="text-xs text-brand-light hover:underline">
                View all
              </a>
            </div>
            <div className="mt-4">
              {topCreatives.length === 0 ? (
                <EmptyState
                  title="Analyze your first creative to start building your creative intelligence."
                  description="Once you upload and analyze ads, your top performers will show up here."
                  action={<ButtonLink href="/analyze">Analyze Creative</ButtonLink>}
                />
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {topCreatives.map((c) => (
                    <a
                      key={c.id}
                      href="/my-creatives"
                      className="w-40 shrink-0 overflow-hidden rounded-xl border border-base-border bg-base-surface transition-colors hover:border-brand/40"
                    >
                      <CreativeThumb url={c.file_url} fileType={c.file_type} className="h-32 w-full rounded-none" />
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/40 text-xs font-semibold text-brand-light">
                            {c.score ?? "—"}
                          </span>
                          <span className="text-[11px] text-ink-muted">{c.file_type === "video" ? "Video" : "Image"}</span>
                        </div>
                        <p className="mt-2 truncate text-xs text-ink-primary">{c.summary || "Analyzed creative"}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="rounded-2xl border border-base-border bg-base-card p-6 xl:col-span-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-ink-primary">Recent Analyses</h3>
              <a href="/my-creatives" className="text-xs text-brand-light hover:underline">
                View all
              </a>
            </div>
            <div className="mt-4">
              <RecentAnalysisTable rows={recentRows} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <AccountStatusCard accounts={accounts} />
          </div>
        </div>

        <a
          href="/contact"
          className="group flex items-center justify-between rounded-2xl border border-base-border bg-base-card p-5 transition-colors hover:border-brand/30"
        >
          <div>
            <p className="text-sm font-medium text-ink-primary">Need help?</p>
            <p className="mt-1 text-xs text-ink-secondary">
              Have a question or need assistance? Send us a message and we&apos;ll get back to you
              as quickly as possible. We typically reply within 1 hour.
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
