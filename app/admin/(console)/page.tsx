import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { getOverview, parseRange, RANGE_LABEL, RANGES } from "@/lib/admin/data";
import { fmtDateTime, fmtNum, NA, pctChange } from "@/lib/admin/format";
import { Badge, Notice, PageHeader, Panel, Segmented, Stat } from "@/components/admin/console/ui";
import { TrendChart } from "@/components/admin/console/TrendChart";

export const dynamic = "force-dynamic";

const PURPLE = "#A78BFA";
const GREEN = "#34D399";
const BLUE = "#7DD3FC";

export default async function AdminOverviewPage({ searchParams }: { searchParams: { range?: string } }) {
  await requireAdminPage("viewer", "/admin");
  const range = parseRange(searchParams.range);
  const res = await getOverview(range);

  const header = (
    <PageHeader
      title="Overview"
      description={`${RANGE_LABEL[range]} · all times in UTC. Hover the ⓘ on any card to see exactly where its number comes from.`}
      actions={<Segmented active={range} items={RANGES.map((r) => ({ key: r, label: r, href: `/admin?range=${r}` }))} />}
    />
  );
  if (!res.ok) {
    return (
      <>
        {header}
        <Notice tone="error" title="Metrics unavailable">
          {res.error}
        </Notice>
      </>
    );
  }
  const o = res.data;
  const hourly = range === "24h";
  const change = pctChange(o.signups, o.signups_prev);
  const billingSince = o.billing_events_since;
  const healthSince = o.system_events_since;

  return (
    <>
      {header}

      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Users</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Registered users" value={fmtNum(o.users_total)} sub="All time" source="Count of every account in Supabase Auth (auth.users). Not affected by the time filter." />
        <Stat
          label="New signups"
          value={fmtNum(o.signups)}
          sub={change && change !== "new" ? <span>{change} vs previous {range}</span> : <span>{fmtNum(o.signups_prev)} in the previous {range}</span>}
          source="Supabase Auth accounts whose created_at falls in the selected window. Compared with the window of equal length just before it."
        />
        <Stat
          label="Active users"
          value={fmtNum(o.active_users)}
          sub="Used a product feature"
          source="Distinct accounts with at least one recorded product action in the window: a credit charge or attempt (analysis / image generation), a saved creative, a brand strategy, or a generated image. Page views are not tracked, so browsing alone doesn't count."
        />
        <Stat
          label="Signed in"
          value={fmtNum(o.signed_in)}
          sub="Last sign-in in window"
          source="Accounts whose Supabase Auth last_sign_in_at is inside the window (= signed in at least once). Sessions that stay logged in without a new sign-in are not counted, so this is a lower bound on visits."
        />
      </div>

      <h2 className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Subscriptions & revenue</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Paying customers"
          value={fmtNum(o.paying)}
          tone="good"
          sub={Object.entries(o.paying_by_plan).length ? Object.entries(o.paying_by_plan).map(([p, n]) => `${p} ${n}`).join(" · ") : "None"}
          source="Profiles with subscription_status = 'active' right now. Only the signature-verified Whop webhook sets this. Current state, so not affected by the time filter."
        />
        <Stat
          label="Active subscriptions"
          value={fmtNum(o.with_membership)}
          sub={`${fmtNum(o.canceling)} set to cancel at period end`}
          source="Active profiles that have a Whop membership id on file (recorded from the verified webhook). Accounts activated before membership ids were stored won't have one, so this can be lower than paying customers."
        />
        <Stat
          label="Paid activations"
          value={billingSince ? fmtNum(o.paid_activations) : NA}
          unavailable={!billingSince}
          sub={billingSince ? `Recorded since ${fmtDateTime(billingSince)}` : "Recorded from migration 016 onward"}
          source="Distinct buyers with a verified Whop membership.activated webhook in the window (table billing_events). Only events received after migration 016 was deployed exist, so earlier conversions aren't included."
        />
        <Stat
          label="MRR"
          value="Not reliable yet"
          unavailable
          sub={<Link href="/admin/payments" className="text-brand-light hover:underline">See collected revenue →</Link>}
          source="Monthly recurring revenue isn't shown: the database doesn't store what each customer pays per month (annual plans, the $1 trial and any promo codes change the real amount). Collected payments from Whop are on the Payments page."
        />
      </div>

      <h2 className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Product usage</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Credits consumed"
          value={fmtNum(o.credits_consumed)}
          sub={Object.entries(o.credits_by_type).map(([k, v]) => `${k.replace("_", " ")} ${fmtNum(v)}`).join(" · ") || "—"}
          source="Sum of settled charges in the credit ledger (credit_transactions, status 'settled') created in the window. Refunded and declined attempts are excluded."
        />
        <Stat label="Analyses completed" value={fmtNum(o.analyses)} sub={`${fmtNum(o.free_reports)} free reports`} source="Saved creative analyses (creatives rows from signed-in users with source 'analysis') created in the window. Free homepage reports are counted separately." />
        <Stat label="Images generated" value={fmtNum(o.generated)} sub="Creative Strategy" source="strategy_generations rows with status 'completed' created in the window." />
        <Stat label="Brand strategies" value={fmtNum(o.strategies)} sub="Analyses started" source="brand_strategies rows created in the window (every version counts)." />
      </div>

      <h2 className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Failures</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Failed after charge"
          value={fmtNum(o.refunded_charges)}
          tone={o.refunded_charges ? "warn" : undefined}
          sub={Object.entries(o.refunded_by_type).map(([k, v]) => `${k.replace("_", " ")} ${v}`).join(" · ") || "Credits auto-refunded"}
          source="Credit-ledger charges that were reserved and then released (refunded) in the window: the analysis or image generation failed or timed out. Declined attempts (insufficient credits) are excluded."
        />
        <Stat label="Failed image generations" value={fmtNum(o.failed_generations)} tone={o.failed_generations ? "warn" : undefined} source="strategy_generations rows currently in status 'failed', last updated in the window." />
        <Stat label="Failed brand analyses" value={fmtNum(o.failed_strategies)} tone={o.failed_strategies ? "warn" : undefined} source="brand_strategies rows in status 'failed', last updated in the window." />
        <Stat
          label="Logged system errors"
          value={healthSince ? fmtNum(o.system_errors) : NA}
          unavailable={!healthSince}
          tone={o.system_errors ? "bad" : undefined}
          sub={healthSince ? <Link href="/admin/health" className="text-brand-light hover:underline">Open System health →</Link> : "Logging starts with migration 016"}
          source="Errors written to system_events (webhook, AI provider, analysis, generation and credit failures). This log starts when migration 016 is deployed; earlier failures were only in hosting logs."
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Signups" subtitle={`New Supabase Auth accounts per ${hourly ? "hour" : "day"}${billingSince ? ", with verified paid activations" : ""}.`}>
          <TrendChart
            hourly={hourly}
            data={o.series}
            series={[{ key: "signups", label: "Signups", color: PURPLE }, ...(billingSince ? [{ key: "activations", label: "Paid activations", color: GREEN }] : [])]}
          />
        </Panel>
        <Panel title="Product usage" subtitle={`Completed analyses and generated images per ${hourly ? "hour" : "day"}.`}>
          <TrendChart
            hourly={hourly}
            data={o.series}
            series={[
              { key: "analyses", label: "Analyses", color: PURPLE },
              { key: "generated", label: "Images generated", color: BLUE },
            ]}
          />
        </Panel>
        <Panel title="Credits consumed" subtitle={`Settled ledger charges per ${hourly ? "hour" : "day"}.`}>
          <TrendChart hourly={hourly} data={o.series} series={[{ key: "credits", label: "Credits", color: PURPLE }]} />
        </Panel>
        <Panel title="Conversion" subtitle="Signups in this window that are paying today.">
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <p className="text-[32px] font-semibold tabular-nums text-white">{o.signups ? `${Math.round((o.cohort_paying / o.signups) * 1000) / 10}%` : "—"}</p>
              <p className="text-xs text-ink-secondary">
                {fmtNum(o.cohort_paying)} of {fmtNum(o.signups)} new accounts have an active subscription now
              </p>
            </div>
            <div>
              <p className="text-[32px] font-semibold tabular-nums text-white">{fmtNum(o.suspended)}</p>
              <p className="text-xs text-ink-secondary">accounts suspended (all time)</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Definition: denominator = Supabase Auth signups created in the window; numerator = those accounts whose subscription_status is &apos;active&apos; at this moment.
            Payment dates before migration 016 aren&apos;t stored, so this is a cohort rate, not a date-attributed one. Visitor → signup conversion needs traffic analytics (
            <Link href="/admin/analytics" className="text-brand-light hover:underline">not connected</Link>).
          </p>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Account status breakdown" subtitle="profiles.subscription_status, all accounts, right now.">
          <div className="flex flex-wrap gap-2">
            {Object.entries(o.status_breakdown).map(([k, v]) => (
              <Badge key={k} color={k === "active" ? "green" : k === "past_due" ? "amber" : k === "cancelled" ? "red" : "gray"}>
                {k} · {fmtNum(v)}
              </Badge>
            ))}
          </div>
        </Panel>
        <Panel title="Website traffic" subtitle="Visitors and page views.">
          <p className="text-sm text-ink-secondary">
            No analytics provider is connected, so visitors and page views can&apos;t be shown.{" "}
            <Link href="/admin/analytics" className="text-brand-light hover:underline">
              See the options →
            </Link>
          </p>
        </Panel>
      </div>
      <p className="mt-6 text-[11px] text-ink-muted">Generated {fmtDateTime(o.generated_at)}.</p>
    </>
  );
}
