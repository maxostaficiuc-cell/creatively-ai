import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { emailsFor, listAudit, listUsers } from "@/lib/admin/data";
import { fmtDateTime } from "@/lib/admin/format";
import { Badge, Empty, Notice, PageHeader, Panel, subscriptionBadge, Table, Td } from "@/components/admin/console/ui";

export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  await requireAdminPage("viewer", "/admin/access");
  const [suspended, history] = await Promise.all([listUsers({ access: "suspended", limit: 100, sort: "created_at" }), listAudit({ prefix: "access.", limit: 50 })]);
  const emails = history.ok ? await emailsFor(history.rows.map((r) => r.target_user_id ?? "")) : {};

  return (
    <>
      <PageHeader
        title="Account access"
        description="Suspended accounts are blocked server-side from the dashboard and every app API. Their account, data, plan and Whop billing are untouched; they can still open the billing page. To suspend or restore someone, open their account from Users."
      />
      <Panel title="Suspended accounts" subtitle="profiles.access_status = 'suspended'" bodyClassName="p-0">
        {!suspended.ok ? (
          <div className="p-5"><Notice tone="error">{suspended.error}</Notice></div>
        ) : suspended.rows.length === 0 ? (
          <Empty title="No suspended accounts">Every account currently has normal access.</Empty>
        ) : (
          <Table head={["Account", "Subscription", "Plan", "Signed up"]} minWidth={640}>
            {suspended.rows.map((u) => (
              <tr key={u.id}>
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-white hover:text-brand-light">{u.email ?? u.id}</Link>
                </Td>
                <Td>{subscriptionBadge(u.subscription_status, u.cancel_at_period_end)}</Td>
                <Td>{u.plan ?? "—"}</Td>
                <Td>{fmtDateTime(u.created_at)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      <Panel title="Access history" subtitle="Suspensions and restorations from the audit log" className="mt-4" bodyClassName="p-0">
        {!history.ok ? (
          <div className="p-5"><Notice tone="error">{history.error}</Notice></div>
        ) : history.rows.length === 0 ? (
          <Empty title="No access changes yet" />
        ) : (
          <Table head={["When", "Account", "Change", "Reason", "Admin"]} minWidth={760}>
            {history.rows.map((a) => (
              <tr key={a.id}>
                <Td>{fmtDateTime(a.created_at)}</Td>
                <Td>
                  {a.target_user_id ? <Link href={`/admin/users/${a.target_user_id}`} className="text-white hover:text-brand-light">{emails[a.target_user_id] || a.target_user_id}</Link> : "—"}
                </Td>
                <Td>{a.action === "access.suspend" ? <Badge color="red">Suspended</Badge> : <Badge color="green">Restored</Badge>}</Td>
                <Td className="max-w-[320px] truncate">{a.reason ?? "—"}</Td>
                <Td>{a.admin_email ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
