import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { emailsFor, listAdjustments, listUsers } from "@/lib/admin/data";
import { fmtDateTime, fmtNum, fmtSigned } from "@/lib/admin/format";
import { CREDIT_COST_GENERATED_IMAGE, CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";
import { PLANS } from "@/lib/pricing";
import { Empty, Notice, PageHeader, Pager, Panel, subscriptionBadge, Table, Td } from "@/components/admin/console/ui";

export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function AdminCreditsPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await requireAdminPage("viewer", "/admin/credits");
  const q = (searchParams.q ?? "").slice(0, 200).trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [found, adj] = await Promise.all([q ? listUsers({ search: q, limit: 10 }) : Promise.resolve(null), listAdjustments(PAGE, (page - 1) * PAGE)]);
  const emails = adj.ok ? await emailsFor(adj.rows.map((r) => r.user_id)) : {};

  return (
    <>
      <PageHeader
        title="Credits"
        description="Find an account to see its balance and full ledger, or to add or remove credits. Every adjustment needs a reason and a confirmation, is applied atomically on the server, can't be applied twice, and is written to the audit log."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Panel title="Adjust a balance" subtitle="Search by email or user ID, then open the account.">
          <form method="get" className="flex gap-2" role="search">
            <input name="q" defaultValue={q} placeholder="email@example.com or user ID" aria-label="Find account" className="h-9 flex-1 rounded-lg border border-white/[0.08] bg-[#0B0B0F] px-3 text-[13px] text-white placeholder:text-ink-muted focus:border-brand/60 focus:outline-none" />
            <button className="h-9 rounded-lg bg-brand px-4 text-[13px] font-medium text-white hover:bg-brand-dark">Find</button>
          </form>
          {found ? (
            !found.ok ? (
              <div className="mt-4"><Notice tone="error">{found.error}</Notice></div>
            ) : found.rows.length === 0 ? (
              <p className="mt-4 text-sm text-ink-secondary">No account matches “{q}”.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/[0.05] rounded-xl border border-white/[0.05]">
                {found.rows.map((u) => (
                  <li key={u.id}>
                    <Link href={`/admin/users/${u.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-white">{u.email ?? "Unknown"}</span>
                        <span className="font-mono text-[11px] text-ink-muted">{u.id}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        {subscriptionBadge(u.has_profile ? u.subscription_status : null, u.cancel_at_period_end)}
                        <span className="tabular-nums text-sm text-white">{u.has_profile ? fmtNum(u.ai_credits) : "—"} credits</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Panel>
        <Panel title="How credits work" subtitle="Read-only reference — not changed by this console">
          <ul className="space-y-1.5 text-xs leading-relaxed text-ink-secondary">
            <li>Image analysis {fmtNum(CREDIT_COST_IMAGE)} · video {fmtNum(CREDIT_COST_VIDEO)} · generated image {fmtNum(CREDIT_COST_GENERATED_IMAGE)}</li>
            <li>Weekly allowance: {PLANS.filter((p) => p.weeklyCredits).map((p) => `${p.id} ${fmtNum(p.weeklyCredits)}`).join(" · ")}</li>
            <li>Added credits are bonus credits: they survive weekly resets. Removals take bonus first.</li>
            <li>Unpaid accounts are held at 0 by the app; credits added to them wait as bonus until they subscribe.</li>
          </ul>
        </Panel>
      </div>

      <Panel title="Recent manual adjustments" subtitle="credit_adjustments — every change made from this console" className="mt-4" bodyClassName="p-0">
        {!adj.ok ? (
          <div className="p-5"><Notice tone="error">{adj.error}</Notice></div>
        ) : adj.rows.length === 0 ? (
          <Empty title="No manual adjustments yet">Adjustments you make will be listed here with the admin, reason and resulting balance.</Empty>
        ) : (
          <>
            <Table head={["When", "Account", "Change", "Balance", "Reason", "Admin"]} minWidth={860}>
              {adj.rows.map((r) => (
                <tr key={r.id}>
                  <Td>{fmtDateTime(r.created_at)}</Td>
                  <Td>
                    <Link href={`/admin/users/${r.user_id}`} className="text-white hover:text-brand-light">{emails[r.user_id] || r.user_id}</Link>
                  </Td>
                  <Td className={`tabular-nums ${r.delta > 0 ? "text-emerald-300" : "text-rose-300"}`}>{fmtSigned(r.delta)}</Td>
                  <Td className="tabular-nums">{fmtNum(r.balance_before)} → {fmtNum(r.balance_after)}</Td>
                  <Td className="max-w-[280px] truncate">{r.reason}</Td>
                  <Td>{r.admin_email ?? "—"}</Td>
                </tr>
              ))}
            </Table>
            <Pager page={page} pageSize={PAGE} total={adj.total} hrefFor={(p) => `/admin/credits?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`} />
          </>
        )}
      </Panel>
    </>
  );
}
