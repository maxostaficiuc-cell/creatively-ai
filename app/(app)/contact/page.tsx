import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { Mail, ArrowRight } from "lucide-react";

const SUPPORT_EMAIL = "trycreatively.ai@gmail.com";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getFreshProfile(supabase, user.id);

  if (!profile) redirect("/login");

  const fromCancel = searchParams.from === "cancel";
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Creatively.ai Support Request")}`;

  return (
    <AppShell profile={profile} greeting="Contact" subtitle="">
      <div className="mx-auto max-w-2xl">
        {fromCancel ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
              Thinking about cancelling?
            </h1>
            <p className="mt-2 text-sm text-ink-secondary">
              We&apos;re sorry to see you go. Before you cancel, if something isn&apos;t working the
              way you expected, send us a message. We&apos;ll do our best to help.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
              Need help? We&apos;re here for you.
            </h1>
            <p className="mt-2 text-sm text-ink-secondary">
              Have a question, need help with your account, or want to talk something through? Just
              send us a message and we&apos;ll get back to you as quickly as possible.
            </p>
          </>
        )}

        <div className="mt-8 rounded-2xl border border-brand/40 bg-base-card p-7 shadow-glow">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand-light">
            <Mail size={20} />
          </div>
          <h2 className="mt-4 font-medium text-ink-primary">Support</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">
            We&apos;re happy to help. Send us an email and we&apos;ll take it from there. We
            typically reply within 1 hour.
          </p>
          <p className="mt-4 text-sm font-medium text-ink-primary">{SUPPORT_EMAIL}</p>
          <a
            href={mailtoHref}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:brightness-110"
          >
            Send us an email <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </AppShell>
  );
}
