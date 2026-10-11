import Link from "next/link";
import { redirect } from "next/navigation";
import { getShowcaseAdmin } from "@/lib/showcaseServer";
import { ShowcaseManager } from "@/components/admin/ShowcaseManager";

export const dynamic = "force-dynamic";

/**
 * /admin/showcase — manage the homepage "Know what makes an ad work" gallery.
 * Only accounts listed in the server-side SHOWCASE_ADMIN_EMAILS env var get in.
 */
export default async function ShowcaseAdminPage() {
  const admin = await getShowcaseAdmin();

  if (!admin.ok && admin.reason === "not-signed-in") {
    redirect("/login?next=/admin/showcase");
  }

  if (!admin.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060609] px-6">
        <div className="max-w-md rounded-2xl border border-base-border bg-base-card p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-primary">Showcase admin</h1>
          {admin.reason === "not-configured" ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              Not configured yet. Add an environment variable named{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-brand-light">SHOWCASE_ADMIN_EMAILS</code>{" "}
              in Netlify with your account email as its value, then redeploy and reload this page.
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-secondary">This account is not allowed to manage the showcase.</p>
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
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold text-ink-primary">Homepage showcase</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Upload up to 10 ad creatives for the “Know what makes an ad work” gallery. Changes appear on
          the homepage right away (refresh the page). Signed in as {admin.email}.
        </p>
        <ShowcaseManager />
      </div>
    </main>
  );
}
