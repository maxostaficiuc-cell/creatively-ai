import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hasRole, isOwnerEmail, requireAdminPage, UUID_RE } from "@/lib/admin/auth";
import { getUserDetail, type LedgerEntry } from "@/lib/admin/data";
import { fmtAgo, fmtDate, fmtDateTime, fmtMoney, fmtNum, fmtSigned, NA, shortId } from "@/lib/admin/format";
import { weeklyAllowanceFor } from "@/lib/types";
import { accessBadge, Badge, describeChange, Empty, KeyVal, Notice, Panel, subscriptionBadge, Table, Td } from "@/components/admin/console/ui";
import { AccessControl, CreditAdjustForm, NoteForm } from "@/components/admin/console/actions";

export const dynamic = "force-dynamic";

const KIND: Record<LedgerEntry["kind"], { label: string; color: "purple" | "gray" | "green" | "amber" }> = {
  analysis: { label: "Analysis", color: "gray" },
  image_generation: { label: "Image generation", color: "gray" },
  admin_adjustment: { label: "Admin adjustment", color: "purple" },
  promo_bonus: { label: "Promotional bonus", color: "green" },
  other: { label: "Other", color: "gray" },
};

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const admin = await requireAdminPage("viewer", `/admin/users/${params.id}`);
  if (!UUID_RE.test(params.id)) notFound();
  const res = await getUserDetail(params.id);
  if (!res.ok) return <Notice tone="error" title="Couldn't load this user">{res.error}</Notice>;
  if (!res.data) notFound();
  const { user: u, profile: p, ledger, analyses, generations, strategies, notes, audit, billing, adminRole } = res.data;
  const canEdit = hasRole(admin, "admin");
  const email = u.email ?? "Unknown email";
  const accessHistory = audit.filter((a) => a.action.startsWith("access."));
  const plan = (p?.plan as string | undefined) ?? null;
  const isOwner = isOwnerEmail(u.email);

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-white">
        <ArrowLeft size={13} /> All users
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-tight text-white">{email}</h1>
          <p className="mt-1 font-mono text-[12px] text-ink-muted">{u.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {subscriptionBadge(u.has_profile ? u.subscription_status : null, u.cancel_at_period_end)}
          {accessBadge(u.access_status, true)}
          {isOwner ? <Badge color="purple">Owner</Badge> : adminRole ? <Badge color="purple">{adminRole}</Badge> : null}
        </div>
      </div>

      {!u.has_profile ? (
        <div className="mb-4">
          <Notice tone="warn" title="No profile row">
            This Supabase Auth account has no profiles row, so plan, credits and access controls are not available.
          </Notice>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Account" subtitle="Supabase Auth" className="xl:col-span-1">
          <KeyVal
            rows={[
              ["Email", email],
              ["Email confirmed", u.email_confirmed_at ? fmtDateTime(u.email_confirmed_at) : "Not confirmed"],
              ["Signed up", fmtDateTime(u.created_at)],
              ["Last sign-in", u.last_sign_in_at ? fmtDateTime(u.last_sign_in_at) : "Never"],
              ["Last recorded activity", u.last_activity_at ? fmtAgo(u.last_activity_at) : "None recorded"],
              ["Name", (p?.full_name as string) || NA],
            ]}
          />
        </Panel>
        <Panel title="Subscription" subtitle="Set only by verified Whop webhooks" className="xl:col-span-1">
          <KeyVal
            rows={[
              ["Plan", plan ?? NA],
              ["Status", (p?.subscription_status as string) ?? NA],
              ["Cancels at period end", p ? (p.cancel_at_period_end ? "Yes" : "No") : NA],
              ["Whop membership", (p?.whop_membership_id as string) || "Not recorded"],
              ["Weekly allowance", plan ? fmtNum(weeklyAllowanceFor(plan)) : NA],
              ["Next credit reset", p?.credits_reset_at ? fmtDateTime(p.credits_reset_at as string) : NA],
            ]}
          />
        </Panel>
        <Panel
          title="Access"
          subtitle="App access is separate from billing"
          actions={u.has_profile && !(isOwner && u.access_status !== "suspended") ? <AccessControl userId={u.id} email={email} status={u.access_status} canEdit={canEdit} isSelf={u.id === admin.id} /> : null}
          className="xl:col-span-1"
        >
          <KeyVal
            rows={[
              ["Current access", u.access_status === "suspended" ? "Suspended" : "Active"],
              ["Last changed", p?.access_changed_at ? fmtDateTime(p.access_changed_at as string) : "Never changed"],
            ]}
          />
          {isOwner ? <p className="mt-3 text-xs text-ink-muted">Owner accounts (ADMIN_EMAILS) can&apos;t be suspended from the console.</p> : null}
          <div className="mt-4 border-t border-white/[0.05] pt-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-ink-muted">Access history</p>
            {accessHistory.length === 0 ? (
              <p className="text-xs text-ink-muted">No access changes recorded.</p>
            ) : (
              <ul className="space-y-2">
                {accessHistory.slice(0, 6).map((a) => (
                  <li key={a.id} className="text-xs text-ink-secondary">
                    <span className={a.action === "access.suspend" ? "text-rose-300" : "text-emerald-300"}>{a.action === "access.suspend" ? "Suspended" : "Restored"}</span> · {fmtDateTime(a.created_at)} · {a.admin_email ?? shortId(a.admin_id)}
                    {a.reason ? <span className="block text-ink-muted">“{a.reason}”</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Credits" subtitle="Balance and ledger" className="mt-4">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-ink-muted">Current balance</p>
            <p className="mt-1 text-[34px] font-semibold tabular-nums text-white">{u.has_profile ? fmtNum(u.ai_credits) : NA}</p>
            <p className="text-xs text-ink-secondary">
              of which bonus {fmtNum(u.bonus_credits)} · consumed all-time {fmtNum(u.credits_consumed)}
            </p>
          </div>
          {u.has_profile ? <CreditAdjustForm userId={u.id} email={email} balance={u.ai_credits ?? 0} subscriptionStatus={u.subscription_status} canEdit={canEdit} /> : null}
        </div>
        <div className="mt-6 rounded-xl border border-white/[0.05]">
          {ledger.length === 0 ? (
            <Empty title="No credit transactions yet" />
          ) : (
            <Table head={["When", "Source", "Change", "Status", "Detail", "Balance after", "Ref"]} minWidth={860}>
              {ledger.slice(0, 100).map((e) => (
                <tr key={`${e.kind}-${e.ref}`}>
                  <Td>{fmtDateTime(e.at)}</Td>
                  <Td>
                    <Badge color={KIND[e.kind].color}>{KIND[e.kind].label}</Badge>
                  </Td>
                  <Td className={`tabular-nums ${e.delta == null ? "text-ink-muted" : e.delta > 0 ? "text-emerald-300" : "text-white"}`}>{e.delta == null ? "0" : fmtSigned(e.delta)}</Td>
                  <Td>{e.status}</Td>
                  <Td className="max-w-[320px] truncate whitespace-normal">
                    {e.detail}
                    {e.actor ? <span className="block text-[11px] text-ink-muted">by {e.actor}</span> : null}
                  </Td>
                  <Td className="tabular-nums">{e.balanceAfter == null ? "—" : fmtNum(e.balanceAfter)}</Td>
                  <Td mono>{shortId(e.ref)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
          Sources: credit_transactions (analysis and image charges, with refunds), credit_adjustments (admin), reward_grants (promotions). Weekly plan-allowance refills are applied
          directly to the balance and aren&apos;t recorded as ledger rows, so they don&apos;t appear here.
        </p>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Creative analyses" subtitle="Metadata only — no images or report content" bodyClassName="p-0">
          {analyses.length === 0 ? (
            <Empty title="No analyses yet" />
          ) : (
            <Table head={["When", "Type", "Source", "Score", "Credits", "ID"]} minWidth={560}>
              {analyses.map((a) => (
                <tr key={a.id}>
                  <Td>{fmtDateTime(a.created_at)}</Td>
                  <Td>{a.file_type ?? "—"}</Td>
                  <Td>{a.source ?? "analysis"}{a.is_simulated ? " · simulated" : ""}</Td>
                  <Td className="tabular-nums">{a.score ?? "—"}</Td>
                  <Td className="tabular-nums">{fmtNum(a.credits_used)}</Td>
                  <Td mono>{shortId(a.id)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Generated images & strategies" subtitle="Creative Strategy" bodyClassName="p-0">
          {generations.length === 0 && strategies.length === 0 ? (
            <Empty title="No Creative Strategy activity" />
          ) : (
            <Table head={["When", "Item", "Status", "Credits", "ID"]} minWidth={560}>
              {[
                ...generations.map((g) => ({ at: g.created_at, key: `g${g.id}`, item: "Generated image", status: g.status, credits: g.credits_charged, id: g.id, err: g.error })),
                ...strategies.map((s) => ({ at: s.created_at, key: `s${s.id}`, item: `Strategy v${s.version}${s.brand_name ? ` · ${s.brand_name}` : ""}`, status: s.status, credits: 0, id: s.id, err: null as string | null })),
              ]
                .sort((a, b) => (a.at < b.at ? 1 : -1))
                .slice(0, 50)
                .map((r) => (
                  <tr key={r.key}>
                    <Td>{fmtDateTime(r.at)}</Td>
                    <Td className="max-w-[220px] truncate">{r.item}</Td>
                    <Td>
                      <Badge color={r.status === "failed" ? "red" : r.status === "completed" || r.status === "ready" ? "green" : "gray"}>{r.status}</Badge>
                      {r.err ? <span className="mt-1 block max-w-[240px] truncate text-[11px] text-ink-muted" title={r.err}>{r.err}</span> : null}
                    </Td>
                    <Td className="tabular-nums">{fmtNum(r.credits)}</Td>
                    <Td mono>{shortId(r.id)}</Td>
                  </tr>
                ))}
            </Table>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Internal notes" subtitle="Visible to admins only">
          <NoteForm userId={u.id} canEdit={canEdit} />
          {notes.length === 0 ? (
            <p className="mt-4 text-xs text-ink-muted">No notes yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
                  <p className="whitespace-pre-wrap text-[13px] text-white">{n.note}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {n.admin_email ?? "admin"} · {fmtDateTime(n.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Billing events" subtitle="Verified Whop webhooks for this email (recorded since migration 016)" bodyClassName="p-0">
          {billing.length === 0 ? (
            <Empty title="No recorded billing events">Webhook events are stored from the moment migration 016 is live. Older history is in your Whop dashboard.</Empty>
          ) : (
            <Table head={["Received", "Event", "Plan", "Amount", "Outcome"]} minWidth={520}>
              {billing.map((b) => (
                <tr key={b.id}>
                  <Td>{fmtDateTime(b.received_at)}</Td>
                  <Td>{b.type}</Td>
                  <Td>{b.plan ?? b.whop_plan_id ?? "—"}</Td>
                  <Td className="tabular-nums">{fmtMoney(b.amount, b.currency)}</Td>
                  <Td>{b.outcome ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <Panel title="Admin activity on this account" subtitle="From the append-only audit log" className="mt-4" bodyClassName="p-0">
        {audit.length === 0 ? (
          <Empty title="No admin actions yet" />
        ) : (
          <Table head={["When", "Admin", "Action", "Reason", "Change"]} minWidth={760}>
            {audit.map((a) => (
              <tr key={a.id}>
                <Td>{fmtDateTime(a.created_at)}</Td>
                <Td>{a.admin_email ?? shortId(a.admin_id)}</Td>
                <Td>
                  <Badge color="purple">{a.action}</Badge>
                </Td>
                <Td className="max-w-[260px] truncate">{a.reason ?? "—"}</Td>
                <Td className="max-w-[360px] truncate tabular-nums">{describeChange(a.before_value, a.after_value)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      <p className="mt-4 text-[11px] text-ink-muted">Signed up {fmtDate(u.created_at)}. Passwords, tokens and payment details are never shown here.</p>
    </>
  );
}
