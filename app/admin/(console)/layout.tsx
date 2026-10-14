import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/console/AdminShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · Creatively.ai",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Private Admin Control Center. Every page below ALSO checks access itself
 * (layouts aren't re-run on client navigation), and every API route checks again.
 */
export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage("viewer");
  return (
    <AdminShell email={admin.email} role={admin.role}>
      {children}
    </AdminShell>
  );
}
