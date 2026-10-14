import { ownerEmails, requireAdminPage } from "@/lib/admin/auth";
import { listAdmins } from "@/lib/admin/data";
import { fmtDateTime } from "@/lib/admin/format";
import { Badge, Empty, Notice, PageHeader, Panel, Table, Td } from "@/components/admin/console/ui";
import { RoleForm } from "@/components/admin/console/actions";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  await requireAdminPage("owner", "/admin/admins");
  const res = await listAdmins();
  const owners = ownerEmails();
  return (
    <>
      <PageHeader
        title="Admins"
        description="Owners come only from the ADMIN_EMAILS environment variable on the server. Owners can give other existing accounts admin or read-only access here; every change is audited. Nobody can grant themselves a role."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title="People with console access" bodyClassName="p-0">
          <Table head={["Email", "Role", "Since"]} minWidth={480}>
            {owners.map((e) => (
              <tr key={`o-${e}`}>
                <Td className="text-white">{e}</Td>
                <Td><Badge color="purple">Owner · ADMIN_EMAILS</Badge></Td>
                <Td>Server config</Td>
              </tr>
            ))}
            {res.ok
              ? res.rows.map((a) => (
                  <tr key={a.user_id}>
                    <Td className="text-white">{a.email}</Td>
                    <Td><Badge color={a.role === "admin" ? "purple" : "gray"}>{a.role === "admin" ? "Admin" : "Viewer"}</Badge></Td>
                    <Td>{fmtDateTime(a.granted_at)}</Td>
                  </tr>
                ))
              : null}
          </Table>
          {res.ok && res.rows.length === 0 ? <Empty title="No additional admins">Only the owners above can open the console.</Empty> : null}
          {!res.ok ? <div className="p-5"><Notice tone="error">{res.error}</Notice></div> : null}
        </Panel>
        <Panel title="Grant or remove access" subtitle="The person must already have a Creatively.ai account with a confirmed email.">
          <RoleForm />
          <ul className="mt-5 space-y-1 text-xs leading-relaxed text-ink-muted">
            <li><b className="text-ink-secondary">Viewer</b>: sees everything, changes nothing.</li>
            <li><b className="text-ink-secondary">Admin</b>: can adjust credits, suspend/restore customers, add notes, resolve health events.</li>
            <li><b className="text-ink-secondary">Owner</b>: everything, plus managing admins. Set via ADMIN_EMAILS only.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
