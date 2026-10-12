import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { CreativeReportView } from "@/components/marketing/CreativeReportView";
import { DEMO_CREATIVES } from "@/lib/demoReports";
import { PostAnalysisOffer } from "@/components/marketing/PostAnalysisOffer";
import { createClient } from "@/lib/supabase/server";
import type { Creative } from "@/lib/types";

export const dynamic = "force-dynamic";

// A free-report result gets its own real, refreshable page. This runs
// entirely server-side using the admin client (never exposed to the
// browser), scoped specifically to is_free_report rows only — it can
// never be used to view a regular authenticated user's private creative,
// even if someone guessed a UUID.
/** Paying users see product actions instead of the introductory offer. */
async function offerMode(): Promise<"offer" | "subscriber"> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "offer";
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .maybeSingle();
    return profile?.subscription_status === "active" ? "subscriber" : "offer";
  } catch {
    return "offer";
  }
}

export default async function ReportPage({ params }: { params: { id: string } }) {
  const mode = await offerMode();
  // Static example reports for the homepage's "See what's working" section
  // — fixed demo data, never touches the database.
  const demo = DEMO_CREATIVES[params.id];
  if (demo) {
    return (
      <>
        <Nav />
        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <Link href="/#winning-ads" className="text-sm text-ink-secondary hover:text-ink-primary">
              ← Back to Creatively.ai
            </Link>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">
              Example Creative Report
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              A demonstration of what a real Creatively.ai analysis looks like — not connected
              advertising performance data.
            </p>
            <div className="mt-8">
              <CreativeReportView
                report={demo.report}
                imageUrl={demo.imageUrl}
                upgrade={<PostAnalysisOffer reportId={params.id} mode={mode} />}
              />
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <>
        <Nav />
        <div className="px-6 py-24 text-center text-sm text-ink-secondary">
          Report viewing is temporarily unavailable.
        </div>
        <Footer />
      </>
    );
  }

  const supabase = createAdminClient();
  const { data: creative } = await supabase
    .from("creatives")
    .select("*")
    .eq("id", params.id)
    .eq("is_free_report", true)
    .single<Creative>();

  if (!creative || !creative.report) notFound();

  return (
    <>
      <Nav />
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="text-sm text-ink-secondary hover:text-ink-primary">
            ← Back to Creatively.ai
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">
            Your Creative Report
          </h1>
          <div className="mt-8">
            <CreativeReportView
              report={creative.report}
              imageUrl={creative.file_url}
              isSimulated={creative.is_simulated}
              upgrade={<PostAnalysisOffer reportId={params.id} mode={mode} />}
            />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
