import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, MousePointerClick, Users, TrendingUp as ScaleIcon, TrendingDown as ReviewIcon, Sparkles as TestIcon, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { CreativeInsightCard } from "@/components/dashboard/CreativeInsightCard";
import { RecentAnalysisTable } from "@/components/dashboard/RecentAnalysisTable";
import { AccountStatusCard } from "@/components/dashboard/AccountStatusCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { Profile } from "@/lib/types";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const firstName = (profile?.full_name || user.email || "there").split(" ")[0];

  // No advertising account connected yet for a brand-new account — show
  // real empty states rather than fabricated performance numbers.
  const hasConnectedAccount = false;

  const accounts = [
    { name: "Meta Ads", connected: false },
    { name: "TikTok Ads", connected: false },
    { name: "Google Ads", connected: false },
  ];

  return (
    <AppShell
      profile={profile ?? null}
      greeting={`${getGreeting()}, ${firstName}. 👋`}
      subtitle="Here's what's happening with your advertising."
    >
      <div className="space-y-6">
        {hasConnectedAccount ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={DollarSign} label="Ad Spend" value="$12,482" delta="18.6%" />
            <MetricCard icon={TrendingUp} label="ROAS" value="4.82x" delta="22.8%" />
            <MetricCard icon={MousePointerClick} label="CTR" value="3.21%" delta="8.7%" />
            <MetricCard icon={Users} label="Conversions" value="184" delta="15.2%" />
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
                description="Once you have analyzed creatives, top performers will surface here."
                href="/my-creatives"
              />
              <CreativeInsightCard
                icon={ReviewIcon}
                tone="red"
                title="Creatives to Review"
                description="Underperforming creatives consuming spend will be flagged here."
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
              <EmptyState
                title="Analyze your first creative to start building your creative intelligence."
                description="Once you upload and analyze ads, your top performers will show up here."
                action={<ButtonLink href="/analyze">Analyze Creative</ButtonLink>}
              />
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
              <RecentAnalysisTable rows={[]} />
            </div>
          </div>

          <div className="xl:col-span-2">
            <AccountStatusCard accounts={accounts} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
