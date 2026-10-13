import Link from "next/link";
import { redirect } from "next/navigation";
import { getShowcaseAdmin } from "@/lib/showcaseServer";
import { RewardsAdmin } from "@/components/admin/RewardsAdmin";

export const dynamic = "force-dynamic";

/**
 * /admin/rewards — status and launch of the early-customer reward.
 * Only accounts listed in the server-side SHOWCASE_ADMIN_EMAILS env var get in.
 */
export default async function RewardsAdminPage() {
  const admin = await getShowcaseAdmin();

  if (!admin.ok && admin.reason === "not-signed-in") {
    redirect("/login?next=/admin/rewards");
  }

  if (!admin.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060609] px-6">
        <div className="max-w-md rounded-2xl border border-base-border bg-base-card p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-primary">Rewards admin</h1>
          {admin.reason === "not-configured" ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              Not configured yet. Add an environment variable named{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-brand-light">SHOWCASE_ADMIN_EMAILS</code>{" "}
              in Netlify with your account email as its value, then redeploy and reload this page.
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-secondary">This account is not allowed to manage rewards.</p>
          )}
          <Link href="/" className="mt-6 inline-block text-sm text-brand-light hover:underline">
            Back to homepage
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060609] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-ink-primary">Early-customer reward</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          10,000 bonus credits for early customers, paid out when ad-account integrations launch. Signed in as {admin.email}.
        </p>
        <RewardsAdmin />
      </div>
    </main>
  );
}
