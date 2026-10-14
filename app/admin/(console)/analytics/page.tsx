import { requireAdminPage } from "@/lib/admin/auth";
import { getFunnel, getOverview, parseRange, RANGE_LABEL, RANGES } from "@/lib/admin/data";
import { fmtDateTime, fmtNum, NA } from "@/lib/admin/format";
import { Notice, PageHeader, Panel, Segmented, Stat } from "@/components/admin/console/ui";
import { TrendChart } from "@/components/admin/console/TrendChart";

export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  await requireAdminPage("viewer", "/admin/analytics");
  const range = parseRange(searchParams.range);
  const [funnel, overview] = await Promise.all([getFunnel(range), getOverview(range)]);

  return (
    <>
      <PageHeader
        title="Website traffic & conversion"
        description={`${RANGE_LABEL[range]} · UTC. Conversion numbers below come from real account and billing records. Traffic numbers need an analytics provider, which isn't connected.`}
        actions={<Segmented active={range} items={RANGES.map((r) => ({ key: r, label: r, href: `/admin/analytics?range=${r}` }))} />}
      />

      <Panel title="Visitors, page views, sources, devices, countries" subtitle="Status: not connected — nothing is being collected today">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {["Unique visitors", "Page views", "Top landing pages", "Referrers & sources"].map((l) => (
            <Stat key={l} label={l} value={NA} unavailable source="No analytics provider is installed on the public site, so this data has never been collected. It can't be reconstructed retroactively." />
          ))}
        </div>
        <div className="mt-5 space-y-3 text-[13px] leading-relaxed text-ink-secondary">
          <p>
            <b className="text-white">What was checked:</b> the codebase has no Google Analytics / Tag Manager, Plausible, PostHog, Umami, Segment, Mixpanel or Vercel Analytics
            code, and the app is hosted on <b className="text-white">Netlify</b>, not Vercel, so Vercel Web Analytics doesn&apos;t apply. Netlify&apos;s own Web Analytics is a
            paid, server-side add-on switched on in the Netlify dashboard; it has no documented public API, so even if it&apos;s on, its numbers can&apos;t be pulled into this
            page reliably (you can view them in Netlify → Analytics).
          </p>
          <p>
            <b className="text-white">To show traffic here, one public-site change is needed.</b> Nothing has been added — this needs your go-ahead. Options, smallest first:
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              <b className="text-white">Plausible Analytics</b> (recommended): one script tag in the site layout, no cookies, no personal data, so no consent banner. Its Stats API
              gives visitors, page views, top pages, landing pages, sources, devices and countries; this page would read it with a server-side PLAUSIBLE_API_KEY. Paid service.
            </li>
            <li>
              <b className="text-white">First-party aggregate counter</b>: a tiny beacon that sends page path, referrer domain, device class and Netlify&apos;s country header to
              our own endpoint, stored as daily counts only (no IPs, no cookies, no IDs). Free; unique visitors would be approximate and there&apos;s no historical backfill.
            </li>
            <li>
              <b className="text-white">Google Analytics 4 + Data API</b>: richest data, but uses cookies, so it needs a consent banner on the public site (a visible change).
            </li>
          </ol>
        </div>
      </Panel>

      {!funnel.ok ? (
        <div className="mt-4"><Notice tone="error">{funnel.error}</Notice></div>
      ) : (
        <Panel title="Signup cohort funnel" subtitle={`Accounts created in the window (${RANGE_LABEL[range].toLowerCase()}) and how far each has got by now.`} className="mt-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["Signed up", funnel.data.signups, "Supabase Auth accounts created in the window (denominator for every rate here)."],
              ["Confirmed email", funnel.data.confirmed, "Of those, accounts with email_confirmed_at set."],
              ["Finished onboarding", funnel.data.onboarded, "Of those, profiles.onboarding_completed = true."],
              ["Used the product", funnel.data.used_product, "Of those, accounts with any credit-ledger entry, saved creative or brand strategy."],
              ["Ever paid", funnel.data.ever_paid, "Of those, accounts whose subscription_status is active, cancelled or past_due (all set only by verified Whop webhooks)."],
              ["Paying now", funnel.data.paying_now, "Of those, accounts with subscription_status = 'active' right now."],
            ].map(([label, v, src]) => (
              <Stat key={String(label)} label={String(label)} value={fmtNum(Number(v))} sub={label === "Signed up" ? "100%" : pct(Number(v), funnel.data.signups)} source={String(src)} />
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Attribution: every step is attributed to the signup date (cohort), not to when the step happened, because payment dates before migration 016 aren&apos;t stored.
            Visitor → signup conversion needs traffic data (above).
          </p>
        </Panel>
      )}

      {overview.ok ? (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <Panel title="Signups and verified paid activations" subtitle={`Per ${range === "24h" ? "hour" : "day"}`}>
            <TrendChart
              hourly={range === "24h"}
              data={overview.data.series}
              series={[
                { key: "signups", label: "Signups", color: "#A78BFA" },
                { key: "activations", label: "Paid activations", color: "#34D399" },
              ]}
            />
          </Panel>
          <Panel title="Paid conversions (verified)" subtitle="From Whop webhooks recorded in billing_events">
            {overview.data.billing_events_since ? (
              <>
                <p className="text-[32px] font-semibold tabular-nums text-white">{fmtNum(overview.data.paid_activations)}</p>
                <p className="text-xs text-ink-secondary">membership activations in the window</p>
                <p className="mt-3 text-xs text-ink-secondary">
                  {fmtNum(overview.data.payments_succeeded)} successful · {fmtNum(overview.data.payments_failed)} failed payments
                </p>
                <p className="mt-3 text-[11px] text-ink-muted">Recording since {fmtDateTime(overview.data.billing_events_since)}.</p>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-ink-muted">
                No verified billing events recorded yet. They&apos;re stored from the moment migration 016 is live, so date-attributed paid conversions start then.
              </p>
            )}
          </Panel>
        </div>
      ) : null}
    </>
  );
}
