import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { emailsFor, listAudit } from "@/lib/admin/data";
import { fmtDateTime } from "@/lib/admin/format";
import { Badge, describeChange, Empty, Notice, PageHeader, Pager, Panel, Segmented, Table, Td } from "@/components/admin/console/ui";

export const dynamic = "force-dynamic";
const PAGE = 50;
const FILTERS = [
  { key: "all", label: "All", prefix: undefined },
  { key: "credits", label: "Credits", prefix: "credits." },
  { key: "access", label: "Access", prefix: "access." },
  { key: "admin", label: "Permissions", prefix: "admin." },
  { key: "note", label: "Notes", prefix: "note." },
  { key: "health", label: "Health", prefix: "health." },
];

export default async function AdminAuditPage({ searchParams }: { searchParams: { f?: string; page?: string } }) {
  await requireAdminPage("viewer", "/admin/audit");
  const f = FILTERS.find((x) => x.key === searchParams.f) ?? FILTERS[0];
  const page = Math.max(1, Number(searchParams.page) || 1);
  const res = await listAudit({ prefix: f.prefix, limit: PAGE, offset: (page - 1) * PAGE });
  const emails = res.ok ? await emailsFor(res.rows.map((r) => r.target_user_id ?? "")) : {};

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every admin action, newest first. The log is append-only: the database rejects edits and deletions, and nobody (including owners) can change it from the console."
        actions={<Segmented active={f.key} items={FILTERS.map((x) => ({ key: x.key, label: x.label, href: x.key === "all" ? "/admin/audit" : `/admin/audit?f=${x.key}` }))} />}
      />
      <Panel bodyClassName="p-0">
        {!res.ok ? (
          <div className="p-5"><Notice tone="error">{res.error}</Notice></div>
        ) : res.rows.length === 0 ? (
          <Empty title="Nothing recorded yet">Credit adjustments, suspensions, restorations, notes and permission changes will appear here.</Empty>
        ) : (
          <>
            <Table head={["When", "Admin", "Action", "Target", "Reason", "Change"]} minWidth={1040}>
              {res.rows.map((a) => (
                <tr key={a.id}>
                  <Td>{fmtDateTime(a.created_at)}</Td>
                  <Td>{a.admin_email ?? a.admin_id}</Td>
                  <Td><Badge color="purple">{a.action}</Badge></Td>
                  <Td>{a.target_user_id ? <Link href={`/admin/users/${a.target_user_id}`} className="text-white hover:text-brand-light">{emails[a.target_user_id] || a.target_user_id}</Link> : "—"}</Td>
                  <Td className="max-w-[240px] truncate">{a.reason ?? "—"}</Td>
                  <Td className="max-w-[360px] truncate tabular-nums">{describeChange(a.before_value, a.after_value)}</Td>
                </tr>
              ))}
            </Table>
            <Pager page={page} pageSize={PAGE} total={res.total} hrefFor={(p) => `/admin/audit?${f.key !== "all" ? `f=${f.key}&` : ""}page=${p}`} />
          </>
        )}
      </Panel>
    </>
  );
}
