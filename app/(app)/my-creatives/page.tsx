import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { FolderOpen } from "lucide-react";
import type { Profile, Creative } from "@/lib/types";
import { CreativeThumb } from "./CreativeThumb";

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: creatives } = await supabase
    .from("creatives")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Creative[]>();

  const list = creatives ?? [];

  return (
    <AppShell profile={profile ?? null} greeting="My Creatives" subtitle="">
      {list.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={<FolderOpen size={20} />}
            title="No creatives analyzed yet"
            description="Upload an ad to get AI-powered scoring and insights on what to test next."
            action={<ButtonLink href="/analyze">Analyze a Creative</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-4">
          {list.map((c) => (
            <div key={c.id} className="rounded-2xl border border-base-border bg-base-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CreativeThumb url={c.file_url} fileType={c.file_type} />
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/40 text-sm font-semibold text-brand-light">
                      {c.score ?? "—"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-primary">{c.summary || "Analyzed creative"}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {c.file_type === "video" ? "Video" : "Image"}
                        {c.platform ? ` · ${c.platform}` : ""} ·{" "}
                        {new Date(c.created_at).toLocaleDateString()}
                        {c.is_simulated ? " · Simulated" : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-ink-muted">{c.credits_used} credits</span>
              </div>
              {c.whats_working && (
                <div className="mt-4 grid gap-2 text-sm text-ink-secondary sm:grid-cols-3">
                  <p><span className="text-accent-green">Working:</span> {c.whats_working}</p>
                  <p><span className="text-accent-red">Not working:</span> {c.whats_not}</p>
                  <p><span className="text-brand-light">Test next:</span> {c.what_to_test}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
