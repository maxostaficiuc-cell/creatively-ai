import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { listBillingEvents, listPendingGrants, listSubscribers, parseRange, RANGE_LABEL, sinceFor, type Range } from "@/lib/admin/data";
import { listWhopMemberships, listWhopPayments, PAYMENT_FILTERS, summarisePayments, whopReadConfigured } from "@/lib/admin/whop";
import { fmtDate, fmtDateTime, fmtMoney, fmtNum, shortId } from "@/lib/admin/format";
import { Badge, Empty, Notice, PageHeader, Panel, Segmented, Stat, subscriptionBadge, Table, Td } from "@/components/admin/console/ui";

export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "payments", label: "Payments" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "webhooks", label: "Verified webhooks" },
  { key: "entitlements", label: "App entitlements" },
];
const MEMBERSHIP_FILTERS: Record<string, { label: string; statuses: string[] }> = {
  active: { label: "Active", statuses: ["active", "trialing"] },
  canceling: { label: "Canceling", statuses: ["canceling"] },
  past_due: { label: "Past due", statuses: ["past_due", "unresolved"] },
  ended: { label: "Cancelled / expired", statuses: ["canceled", "expired", "completed"] },
};

function substatusBadge(s: string | null) {
  if (!s) return <Badge>unknown</Badge>;
  if (s === "succeeded") return <Badge color="green">succeeded</Badge>;
  if (PAYMENT_FILTERS.refunded.substatuses.includes(s)) return <Badge color="amber">{s.replace(/_/g, " ")}</Badge>;
  if (PAYMENT_FILTERS.failed.substatuses.includes(s)) return <Badge color="red">{s.replace(/_/g, " ")}</Badge>;
  return <Badge>{s.replace(/_/g, " ")}</Badge>;
}

type SP = { view?: string; range?: string; status?: string; m?: string };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage("viewer", "/admin/payments");
  const view = VIEWS.find((v) => v.key === searchParams.view)?.key ?? "payments";
  const range: Range = parseRange(searchParams.range === "24h" ? "7d" : searchParams.range);
  const status = (Object.keys(PAYMENT_FILTERS).includes(searchParams.status ?? "") ? searchParams.status : "all") as keyof typeof PAYMENT_FILTERS;
  const m = Object.keys(MEMBERSHIP_FILTERS).includes(searchParams.m ?? "") ? searchParams.m! : "active";
  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const next = { view, range, status, m, ...patch };
    if (next.view !== "payments") p.set("view", next.view);
    if (next.range !== "30d") p.set("range", next.range);
    if (next.status !== "all") p.set("status", next.status);
    if (next.m !== "active") p.set("m", next.m);
    const qs = p.toString();
    return `/admin/payments${qs ? `?${qs}` : ""}`;
  };
  const cfg = whopReadConfigured();

  return (
    <>
      <PageHeader
        title="Payments & subscriptions"
        description="Live payment and membership data is read from Whop's API on the server (read-only). Verified webhook records and the app's own entitlement state are shown separately so they can be compared. Nothing here can charge, refund or cancel."
        actions={<Segmented active={view} items={VIEWS.map((v) => ({ key: v.key, label: v.label, href: href({ view: v.key }) }))} />}
      />

      {(view === "payments" || view === "subscriptions") && !cfg.ok ? (
        <Notice tone="warn" title="Whop data isn't connected yet">
          Add <code className="text-brand-light">{cfg.missing.join(" and ")}</code> to the server environment (Netlify → Site configuration → Environment variables), then redeploy.
          WHOP_COMPANY_ID is your company id (starts with <code>biz_</code>, shown in the Whop dashboard URL). The existing company API key needs the
          permissions <code>payment:basic:read</code>, <code>member:basic:read</code>, <code>member:email:read</code> and <code>plan:basic:read</code>. Until then, use the
          Verified webhooks and App entitlements tabs.
        </Notice>
      ) : null}

      {view === "payments" && cfg.ok ? <PaymentsView range={range} status={status} href={href} /> : null}
      {view === "subscriptions" && cfg.ok ? <SubscriptionsView m={m} href={href} /> : null}
      {view === "webhooks" ? <WebhooksView range={range} href={href} /> : null}
      {view === "entitlements" ? <EntitlementsView /> : null}

      <Panel title="Why there's no MRR figure" className="mt-4">
        <p className="text-xs leading-relaxed text-ink-secondary">
          A reliable MRR needs each active subscription&apos;s real recurring price. The database only stores the plan name; Whop memberships expose a formatted renewal price
          string, and annual plans, the $1 Starter trial and promo codes all change what a customer actually pays per month. Rather than estimate from list prices, this page
          shows money actually collected (Whop payments) and the number of active subscriptions.
        </p>
      </Panel>
    </>
  );
}

async function PaymentsView({ range, status, href }: { range: Range; status: keyof typeof PAYMENT_FILTERS; href: (p: Partial<SP>) => string }) {
  const res = await listWhopPayments({ since: sinceFor(range), filter: status });
  const controls = (
    <div className="mb-4 flex flex-wrap gap-2">
      <Segmented active={range} items={(["7d", "30d", "90d"] as Range[]).map((r) => ({ key: r, label: r, href: href({ range: r }) }))} />
      <Segmented active={status} items={Object.entries(PAYMENT_FILTERS).map(([k, v]) => ({ key: k, label: v.label, href: href({ status: k }) }))} />
    </div>
  );
  if (!res.ok) {
    return (
      <>
        {controls}
        <Notice tone="error" title="Couldn't read payments from Whop">{res.message}</Notice>
      </>
    );
  }
  const sum = summarisePayments(res.rows);
  const currencies = Object.entries(sum.byCurrency);
  return (
    <>
      {controls}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Collected (gross)"
          value={currencies.length ? currencies.map(([c, v]) => fmtMoney(v.gross, c)).join(" · ") : fmtMoney(0, "usd")}
          sub={status === "all" ? `${RANGE_LABEL[range]}` : "Within this filter"}
          source="Sum of Whop payment totals for succeeded and refunded payments created in the window, per currency, exactly as Whop reports them (provider data, read live)."
        />
        <Stat label="Refunded" value={currencies.length ? currencies.map(([c, v]) => fmtMoney(v.refunded, c)).join(" · ") : fmtMoney(0, "usd")} source="Sum of refunded_amount on those payments, as reported by Whop." />
        <Stat label="Successful payments" value={fmtNum(sum.succeeded)} tone="good" source="Payments with Whop substatus 'succeeded' in the window." />
        <Stat label="Failed / pending" value={`${fmtNum(sum.failed)} / ${fmtNum(sum.pending)}`} tone={sum.failed ? "warn" : undefined} source="Payments whose Whop substatus is failed/blocked/past_due/uncollectible, and pending/requires_capture/incomplete." />
      </div>
      {!res.complete ? <div className="mt-3"><Notice tone="warn">More than {res.rows.length} payments matched — totals cover the newest {res.rows.length}. Narrow the date range for exact totals.</Notice></div> : null}
      <Panel title="Payments" subtitle="From Whop · newest first · amounts in each payment's currency" className="mt-4" bodyClassName="p-0">
        {res.rows.length === 0 ? (
          <Empty title="No payments in this window">Nothing matched in Whop for {RANGE_LABEL[range].toLowerCase()} with this filter.</Empty>
        ) : (
          <Table head={["Created", "Customer", "Plan", "Amount", "Status", "Reason", "Refunded", "Paid", "Payment", "Membership"]} minWidth={1240}>
            {res.rows.map((p) => (
              <tr key={p.id}>
                <Td>{fmtDateTime(p.created_at)}</Td>
                <Td className="max-w-[220px] truncate text-white">{p.email ?? "Not available"}</Td>
                <Td>{p.plan ? `${p.plan} · ${p.interval}` : p.product ?? shortId(p.plan_id)}</Td>
                <Td className="tabular-nums text-white">{fmtMoney(p.total, p.currency)}</Td>
                <Td>
                  {substatusBadge(p.substatus)}
                  {p.failure_message ? <span className="mt-1 block max-w-[200px] truncate text-[11px] text-ink-muted" title={p.failure_message}>{p.failure_message}</span> : null}
                </Td>
                <Td>{p.billing_reason?.replace(/_/g, " ") ?? "—"}</Td>
                <Td className="tabular-nums">{p.refunded_amount ? fmtMoney(p.refunded_amount, p.currency) : "—"}</Td>
                <Td>{p.paid_at ? fmtDate(p.paid_at) : "—"}</Td>
                <Td mono>{p.id}</Td>
                <Td mono>{p.membership_id ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}

async function SubscriptionsView({ m, href }: { m: string; href: (p: Partial<SP>) => string }) {
  const res = await listWhopMemberships({ statuses: MEMBERSHIP_FILTERS[m].statuses });
  return (
    <>
      <div className="mb-4">
        <Segmented active={m} items={Object.entries(MEMBERSHIP_FILTERS).map(([k, v]) => ({ key: k, label: v.label, href: href({ m: k }) }))} />
      </div>
      {!res.ok ? (
        <Notice tone="error" title="Couldn't read memberships from Whop">{res.message}</Notice>
      ) : (
        <Panel title={`${MEMBERSHIP_FILTERS[m].label} memberships`} subtitle={`From Whop${res.total != null ? ` · ${fmtNum(res.total)} total` : ""}`} bodyClassName="p-0">
          {res.rows.length === 0 ? (
            <Empty title="No memberships in this state" />
          ) : (
            <Table head={["Customer", "Plan", "Status", "Renews / ends", "Cancel at period end", "Cancelled", "Renewal price", "Started", "Membership"]} minWidth={1160}>
              {res.rows.map((x) => (
                <tr key={x.id}>
                  <Td className="max-w-[220px] truncate text-white">{x.email ?? "Not available"}</Td>
                  <Td>{x.plan ? `${x.plan} · ${x.interval}` : shortId(x.plan_id)}</Td>
                  <Td><Badge color={x.status === "active" || x.status === "trialing" ? "green" : x.status === "past_due" ? "amber" : x.status === "canceling" ? "amber" : "gray"}>{x.status ?? "unknown"}</Badge></Td>
                  <Td>{x.renewal_period_end ? fmtDate(x.renewal_period_end) : "—"}</Td>
                  <Td>{x.cancel_at_period_end == null ? "—" : x.cancel_at_period_end ? "Yes" : "No"}</Td>
                  <Td>{x.canceled_at ? fmtDate(x.canceled_at) : "—"}</Td>
                  <Td>{x.renewal_price ?? "—"}</Td>
                  <Td>{fmtDate(x.created_at)}</Td>
                  <Td mono>{x.id}</Td>
                </tr>
              ))}
            </Table>
          )}
          {!res.complete ? <p className="px-4 py-3 text-xs text-ink-muted">Showing the newest {res.rows.length}.</p> : null}
        </Panel>
      )}
    </>
  );
}

async function WebhooksView({ range, href }: { range: Range; href: (p: Partial<SP>) => string }) {
  const res = await listBillingEvents({ since: sinceFor(range), limit: 200 });
  return (
    <>
      <div className="mb-4">
        <Segmented active={range} items={(["7d", "30d", "90d"] as Range[]).map((r) => ({ key: r, label: r, href: href({ range: r }) }))} />
      </div>
      <Panel
        title="Verified Whop webhook events"
        subtitle="Only signature-verified deliveries are recorded (table billing_events). Recording starts when migration 016 is live; earlier history exists only in Whop."
        bodyClassName="p-0"
      >
        {!res.ok ? (
          <div className="p-5"><Notice tone="error">{res.error}</Notice></div>
        ) : res.rows.length === 0 ? (
          <Empty title="No verified webhook events in this window" />
        ) : (
          <Table head={["Received", "Event", "Customer", "Plan", "Amount", "Status", "What the app did", "Event ID"]} minWidth={1100}>
            {res.rows.map((b) => (
              <tr key={b.id}>
                <Td>{fmtDateTime(b.received_at)}</Td>
                <Td>{b.type}</Td>
                <Td className="max-w-[220px] truncate">
                  {b.matched_user_id ? <Link href={`/admin/users/${b.matched_user_id}`} className="text-white hover:text-brand-light">{b.email}</Link> : b.email ?? "—"}
                </Td>
                <Td>{b.plan ?? b.whop_plan_id ?? "—"}</Td>
                <Td className="tabular-nums">{fmtMoney(b.amount, b.currency)}</Td>
                <Td>{b.substatus ?? b.status ?? "—"}</Td>
                <Td><Badge color={b.outcome === "granted" ? "green" : b.outcome === "revoked" ? "red" : b.outcome === "unknown_plan" || b.outcome === "no_account" ? "amber" : "gray"}>{b.outcome ?? "—"}</Badge></Td>
                <Td mono>{b.id}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}

async function EntitlementsView() {
  const [subs, grants] = await Promise.all([listSubscribers(), listPendingGrants()]);
  return (
    <>
      <Panel title="Accounts with a paid status in the app" subtitle="profiles.subscription_status ≠ 'unpaid' — written only by the verified webhook" bodyClassName="p-0">
        {!subs.ok ? (
          <div className="p-5"><Notice tone="error">{subs.error}</Notice></div>
        ) : subs.rows.length === 0 ? (
          <Empty title="No paying or formerly-paying accounts yet" />
        ) : (
          <Table head={["Account", "Plan", "Status", "Whop membership", "Next credit reset"]} minWidth={860}>
            {subs.rows.map((s) => (
              <tr key={s.id}>
                <Td><Link href={`/admin/users/${s.id}`} className="text-white hover:text-brand-light">{s.email ?? s.id}</Link></Td>
                <Td>{s.plan ?? "—"}</Td>
                <Td>{subscriptionBadge(s.subscription_status, s.cancel_at_period_end)}</Td>
                <Td mono>{s.whop_membership_id ?? "Not recorded"}</Td>
                <Td>{s.subscription_status === "active" ? fmtDateTime(s.credits_reset_at) : "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      <Panel title="Paid, waiting for signup" subtitle="Verified payments whose buyer hasn't created/confirmed an account yet (pending_grants)" className="mt-4" bodyClassName="p-0">
        {grants.length === 0 ? (
          <Empty title="None waiting" />
        ) : (
          <Table head={["Buyer email", "Plan", "Paid"]} minWidth={520}>
            {grants.map((g) => (
              <tr key={g.email}>
                <Td className="text-white">{g.email}</Td>
                <Td>{g.plan}</Td>
                <Td>{fmtDateTime(g.created_at)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
