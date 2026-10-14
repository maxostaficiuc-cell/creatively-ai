import { adminJson, requireAdminApi } from "@/lib/admin/auth";
import { listUsers } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET ?q=&limit= — quick user lookup for the console (viewer+). */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request, "viewer");
  if (!auth.ok) return auth.res;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 200);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 10, 1), 50);
  const res = await listUsers({ search: q, limit, offset: 0 });
  if (!res.ok) return adminJson({ error: res.error }, 500);
  return adminJson({
    total: res.total,
    users: res.rows.map((u) => ({ id: u.id, email: u.email, plan: u.plan, subscriptionStatus: u.subscription_status, accessStatus: u.access_status, credits: u.ai_credits })),
  });
}
