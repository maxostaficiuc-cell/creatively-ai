import Link from "next/link";
import { hasRole, requireAdminPage } from "@/lib/admin/auth";
import { getHealth, parseRange, RANGE_LABEL, RANGES } from "@/lib/admin/data";
import { fmtAgo, fmtDateTime, fmtNum, NA, shortId } from "@/lib/admin/format";
import { Badge, Empty, Notice, PageHeader, Panel, Segmented, Stat, Table, Td } from "@/components/admin/console/ui";
import { ResolveButton } from "@/components/admin/console/actions";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  analysis: "Analysis",
  image_generation: "Image generation",
  strategy: "Strategy",
  ai_provider: "AI provider",
  credits: "Credits",
  webhook: "Payment webhook",
  auth: "Auth",
  backend: "Backend",
  job: "Job",
};

export default async function AdminHealthPage({ searchParams }: { searchParams: { range?: string; open?: string } }) {
  const admin = await requireAdminPage("viewer", "/admin/health");
  const range = parseRange(searchParams.range, "7d");
  const onlyOpen = searchParams.open === "1";
  const h = await getHealth(range);
  const events = onlyOpen ? h.events.filter((e) => !e.resolved_at) : h.events;
  const count = (cat: string) => h.events.filter((e) => e.category === cat && e.severity !== "info").length;
  const canResolve = hasRole(admin, "admin");
  const link = (patch: { range?: string; open?: string }) => {
    const p = new URLSearchParams();
    const r = patch.range ?? range;
    const o = patch.open ?? (onlyOpen ? "1" : "");
    if (r !== "7d") p.set("range", r);
    if (o) p.set("open", o);
    const qs = p.toString();
    return `/admin/health${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="System health"
        description={`${RANGE_LABEL[range]}. Built from records the app keeps: the credit ledger, generation and strategy rows, webhook receipts, and the structured error log (system_events). Messages are sanitised — no keys, tokens or customer content.`}
        actions={<Segmented active={range} items={RANGES.map((r) => ({ key: r, label: r, href: link({ range: r }) }))} />}
      />

      {h.eventsError ? <div className="mb-4"><Notice tone="error">{h.eventsError}</Notice></div> : null}
      {!h.eventsError && !h.eventsSince ? (
        <div className="mb-4">
          <Notice title="Error logging has just started">
            The structured error log begins when migration 016 is deployed. Failures before that were only written to Netlify&apos;s function logs (Netlify → Logs → Functions)
            and aren&apos;t shown here. The ledger- and table-based checks below do include older data.
          </Notice>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Failed after charge" value={fmtNum(h.refunded.length)} tone={h.refunded.length ? "warn" : undefined} sub="Credits auto-returned" source="Credit-ledger charges released (refunded) in the window: the analysis or image generation failed after credits were reserved. Up to the 50 most recent." />
        <Stat label="Failed image generations" value={fmtNum(h.failedGenerations.length)} tone={h.failedGenerations.length ? "warn" : undefined} source="strategy_generations in status 'failed', last updated in the window (up to 50)." />
        <Stat label="Stuck / delayed jobs" value={fmtNum(h.stuckReservations.length + h.stuckGenerations.length)} tone={h.stuckReservations.length + h.stuckGenerations.length ? "bad" : "good"} sub="Right now" source="Credit reservations still 'reserved' after 3 minutes (they auto-release on the user's next request) plus image generations stuck in 'generating' for over 5 minutes." />
        <Stat label="Payment webhooks processed" value={h.webhooksProcessed == null ? NA : fmtNum(h.webhooksProcessed)} sub={h.lastWebhookAt ? `Last ${fmtAgo(h.lastWebhookAt)}` : "None yet"} source="Verified Whop events recorded in webhook_events in the window. Rejected or failed deliveries appear in the error log below." />
        <Stat label="AI provider errors" value={h.eventsSince ? fmtNum(count("ai_provider")) : NA} unavailable={!h.eventsSince} tone={count("ai_provider") ? "warn" : undefined} source="system_events with category ai_provider (Anthropic / Gemini failures, timeouts, rate limits)." />
        <Stat label="Webhook failures" value={h.eventsSince ? fmtNum(count("webhook")) : NA} unavailable={!h.eventsSince} tone={count("webhook") ? "bad" : undefined} source="system_events with category webhook: rejected signatures (throttled to 1/min), unknown plans, handler errors, unapplied grants." />
        <Stat label="Credit errors" value={h.eventsSince ? fmtNum(count("credits")) : NA} unavailable={!h.eventsSince} tone={count("credits") ? "bad" : undefined} source="system_events with category credits: ledger errors and refunds that couldn't be confirmed." />
        <Stat label="Auth problems" value={NA} unavailable sub="See Supabase → Logs → Auth" source="Sign-in failures happen inside Supabase Auth, which keeps its own logs. The app doesn't receive them, so they can't be shown here." />
      </div>

      <Panel
        title="Error log"
        subtitle={h.eventsSince ? `system_events · recording since ${fmtDateTime(h.eventsSince)}` : "system_events"}
        className="mt-6"
        bodyClassName="p-0"
        actions={<Segmented active={onlyOpen ? "open" : "all"} items={[{ key: "all", label: "All", href: link({ open: "" }) }, { key: "open", label: "Unresolved", href: link({ open: "1" }) }]} />}
      >
        {events.length === 0 ? (
          <Empty title={onlyOpen ? "No unresolved errors" : "No errors logged in this window"} />
        ) : (
          <Table head={["When", "Category", "Code", "Message", "Ref", "User", "Status"]} minWidth={1100}>
            {events.map((e) => (
              <tr key={e.id}>
                <Td>{fmtDateTime(e.created_at)}</Td>
                <Td><Badge color={e.severity === "error" ? "red" : e.severity === "warning" ? "amber" : "gray"}>{CATEGORY_LABEL[e.category] ?? e.category}</Badge></Td>
                <Td mono>{e.code ?? "—"}</Td>
                <Td className="max-w-[360px] whitespace-normal text-[12px]">{e.message ?? "—"}<span className="block text-[11px] text-ink-muted">{e.source}</span></Td>
                <Td mono>{e.ref_id ? shortId(e.ref_id) : "—"}</Td>
                <Td>{e.user_id ? <Link href={`/admin/users/${e.user_id}`} className="text-brand-light hover:underline">{shortId(e.user_id)}</Link> : "—"}</Td>
                <Td>{e.resolved_at ? <Badge color="green">Resolved</Badge> : canResolve ? <ResolveButton id={e.id} /> : <Badge>Open</Badge>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Charges refunded after a failure" subtitle="credit_transactions released after being charged" bodyClassName="p-0">
          {h.refunded.length === 0 ? (
            <Empty title="None in this window" />
          ) : (
            <Table head={["When", "Type", "Credits", "User", "Request"]} minWidth={560}>
              {h.refunded.map((r) => (
                <tr key={r.request_id + r.user_id}>
                  <Td>{fmtDateTime(r.updated_at)}</Td>
                  <Td>{r.media_type ?? "—"}</Td>
                  <Td className="tabular-nums">{fmtNum(r.amount)}</Td>
                  <Td><Link href={`/admin/users/${r.user_id}`} className="text-brand-light hover:underline">{shortId(r.user_id)}</Link></Td>
                  <Td mono>{shortId(r.request_id)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Failed image generations" subtitle="strategy_generations · status failed" bodyClassName="p-0">
          {h.failedGenerations.length === 0 ? (
            <Empty title="None in this window" />
          ) : (
            <Table head={["When", "Error shown to the user", "Attempts", "User", "ID"]} minWidth={620}>
              {h.failedGenerations.map((g) => (
                <tr key={g.id}>
                  <Td>{fmtDateTime(g.updated_at)}</Td>
                  <Td className="max-w-[260px] whitespace-normal text-[12px]">{g.error ?? "—"}</Td>
                  <Td className="tabular-nums">{g.attempts}</Td>
                  <Td><Link href={`/admin/users/${g.user_id}`} className="text-brand-light hover:underline">{shortId(g.user_id)}</Link></Td>
                  <Td mono>{shortId(g.id)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Stuck or delayed" subtitle="Right now, regardless of the time filter" bodyClassName="p-0">
          {h.stuckReservations.length + h.stuckGenerations.length === 0 ? (
            <Empty title="Nothing stuck" />
          ) : (
            <Table head={["Since", "What", "User", "Ref"]} minWidth={520}>
              {h.stuckReservations.map((r) => (
                <tr key={`r${r.request_id}${r.user_id}`}>
                  <Td>{fmtAgo(r.created_at)}</Td>
                  <Td>{fmtNum(r.amount)} credits held ({r.media_type ?? "charge"}) — returned on the user&apos;s next request</Td>
                  <Td><Link href={`/admin/users/${r.user_id}`} className="text-brand-light hover:underline">{shortId(r.user_id)}</Link></Td>
                  <Td mono>{shortId(r.request_id)}</Td>
                </tr>
              ))}
              {h.stuckGenerations.map((g) => (
                <tr key={`g${g.id}`}>
                  <Td>{fmtAgo(g.updated_at)}</Td>
                  <Td>Image generation still “generating” (attempt {g.attempts})</Td>
                  <Td><Link href={`/admin/users/${g.user_id}`} className="text-brand-light hover:underline">{shortId(g.user_id)}</Link></Td>
                  <Td mono>{shortId(g.id)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Failed brand analyses & unclaimed payments" bodyClassName="p-0">
          {h.failedStrategies.length + h.pendingGrants.length === 0 ? (
            <Empty title="Nothing to review" />
          ) : (
            <Table head={["When", "What", "Who"]} minWidth={520}>
              {h.failedStrategies.map((s) => (
                <tr key={s.id}>
                  <Td>{fmtDateTime(s.updated_at)}</Td>
                  <Td>Brand analysis failed{s.brand_name ? ` (${s.brand_name})` : ""}</Td>
                  <Td><Link href={`/admin/users/${s.user_id}`} className="text-brand-light hover:underline">{shortId(s.user_id)}</Link></Td>
                </tr>
              ))}
              {h.pendingGrants.map((g) => (
                <tr key={g.email}>
                  <Td>{fmtDateTime(g.created_at)}</Td>
                  <Td>Paid for {g.plan}, no confirmed account yet</Td>
                  <Td className="text-white">{g.email}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
