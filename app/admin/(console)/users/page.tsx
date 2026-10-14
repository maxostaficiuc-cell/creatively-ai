import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/auth";
import { listUsers, USER_SORTS, type UserSort } from "@/lib/admin/data";
import { fmtAgo, fmtDate, fmtNum } from "@/lib/admin/format";
import { accessBadge, Empty, Notice, PageHeader, Pager, Panel, subscriptionBadge, Table, Td, withParams } from "@/components/admin/console/ui";
import { PLANS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
type SP = { q?: string; plan?: string; sub?: string; access?: string; from?: string; to?: string; sort?: string; dir?: string; page?: string };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminUsersPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage("viewer", "/admin/users");
  const sort: UserSort = (USER_SORTS as readonly string[]).includes(searchParams.sort ?? "") ? (searchParams.sort as UserSort) : "created_at";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Math.min(10_000, Number(searchParams.page) || 1));
  const plans = PLANS.map((p) => p.id as string);
  const plan = plans.includes(searchParams.plan ?? "") ? searchParams.plan : undefined;
  const sub = ["active", "unpaid", "cancelled", "past_due", "none"].includes(searchParams.sub ?? "") ? searchParams.sub : undefined;
  const access = ["active", "suspended"].includes(searchParams.access ?? "") ? searchParams.access : undefined;
  const from = DATE.test(searchParams.from ?? "") ? searchParams.from : undefined;
  const to = DATE.test(searchParams.to ?? "") ? searchParams.to : undefined;
  const q = (searchParams.q ?? "").slice(0, 200);

  const res = await listUsers({
    search: q,
    plan,
    subscription: sub,
    access,
    signupFrom: from ? `${from}T00:00:00Z` : undefined,
    signupTo: to ? new Date(Date.parse(`${to}T00:00:00Z`) + 864e5).toISOString() : undefined,
    sort,
    dir,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const current: Record<string, string | undefined> = { q: q || undefined, plan, sub, access, from, to, sort: sort === "created_at" ? undefined : sort, dir: dir === "desc" ? undefined : dir };
  const sortHead = (key: UserSort, label: string) => {
    const active = sort === key;
    const nextDir = active && dir === "desc" ? "asc" : "desc";
    return (
      <Link href={withParams("/admin/users", current, { sort: key, dir: nextDir, page: null })} className={`inline-flex items-center gap-1 hover:text-white ${active ? "text-white" : ""}`}>
        {label}
        {active ? dir === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} /> : null}
      </Link>
    );
  };
  const select = "h-9 rounded-lg border border-white/[0.08] bg-[#0B0B0F] px-2.5 text-[13px] text-white focus:border-brand/60 focus:outline-none";

  return (
    <>
      <PageHeader title="Users" description="Every registered account from Supabase Auth, joined with its profile, subscription and usage. Click an email for the full record." />

      <form method="get" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto_auto_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search email or user ID" aria-label="Search email or user ID" className={`${select} col-span-2 sm:col-span-3 lg:col-span-1`} />
        <select name="plan" defaultValue={plan ?? ""} aria-label="Plan" className={select}>
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select name="sub" defaultValue={sub ?? ""} aria-label="Subscription status" className={select}>
          <option value="">Any subscription</option>
          <option value="active">Active</option>
          <option value="unpaid">Unpaid</option>
          <option value="past_due">Past due</option>
          <option value="cancelled">Cancelled</option>
          <option value="none">No profile</option>
        </select>
        <select name="access" defaultValue={access ?? ""} aria-label="Account access" className={select}>
          <option value="">Any access</option>
          <option value="active">Access active</option>
          <option value="suspended">Suspended</option>
        </select>
        <input type="date" name="from" defaultValue={from} aria-label="Signed up from" className={select} />
        <input type="date" name="to" defaultValue={to} aria-label="Signed up to" className={select} />
        <div className="flex gap-2">
          <button className="h-9 flex-1 rounded-lg bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-dark">Apply</button>
          <Link href="/admin/users" className="inline-flex h-9 items-center rounded-lg border border-white/[0.08] px-3 text-[13px] text-ink-secondary hover:text-white">
            Reset
          </Link>
        </div>
      </form>

      {!res.ok ? (
        <Notice tone="error" title="Couldn't load users">
          {res.error}
        </Notice>
      ) : (
        <Panel bodyClassName="p-0">
          {res.rows.length === 0 ? (
            <Empty title={q || plan || sub || access || from || to ? "No users match these filters" : "No registered users yet"}>
              {q || plan || sub || access || from || to ? "Try a broader search or reset the filters." : "Accounts appear here as soon as someone signs up."}
            </Empty>
          ) : (
            <>
              <Table
                minWidth={1180}
                head={[
                  sortHead("email", "Email"),
                  "Plan",
                  "Subscription",
                  "Access",
                  sortHead("credits", "Credits"),
                  sortHead("consumed", "Consumed"),
                  sortHead("analyses", "Analyses"),
                  "Generated",
                  sortHead("created_at", "Signed up"),
                  sortHead("last_sign_in", "Last sign-in"),
                  sortHead("last_activity", "Last activity"),
                ]}
              >
                {res.rows.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td className="max-w-[260px]">
                      <Link href={`/admin/users/${u.id}`} className="block truncate font-medium text-white hover:text-brand-light">
                        {u.email ?? "Unknown"}
                      </Link>
                      <span className="font-mono text-[11px] text-ink-muted">{u.id}</span>
                    </Td>
                    <Td>{u.has_profile ? u.plan ?? "Unknown" : "Not available"}</Td>
                    <Td>{subscriptionBadge(u.has_profile ? u.subscription_status : null, u.cancel_at_period_end)}</Td>
                    <Td>{accessBadge(u.access_status)}</Td>
                    <Td className="tabular-nums text-white">{u.has_profile ? fmtNum(u.ai_credits) : "—"}</Td>
                    <Td className="tabular-nums">{fmtNum(u.credits_consumed)}</Td>
                    <Td className="tabular-nums">{fmtNum(u.analyses)}</Td>
                    <Td className="tabular-nums">{fmtNum(u.generated)}</Td>
                    <Td>{fmtDate(u.created_at)}</Td>
                    <Td>{u.last_sign_in_at ? fmtAgo(u.last_sign_in_at) : "Never"}</Td>
                    <Td>{u.last_activity_at ? fmtAgo(u.last_activity_at) : "None recorded"}</Td>
                  </tr>
                ))}
              </Table>
              <Pager page={page} pageSize={PAGE_SIZE} total={res.total} hrefFor={(p) => withParams("/admin/users", current, { page: String(p) })} />
            </>
          )}
        </Panel>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
        Consumed = settled credit-ledger charges. Last sign-in comes from Supabase Auth; last activity is the newest recorded charge, creative, strategy or generated image (page visits aren&apos;t tracked).
      </p>
    </>
  );
}
