"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/lib/types";

export function SettingsClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [notifications, setNotifications] = useState(profile.notifications_enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ full_name: fullName, notifications_enabled: notifications })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function handleCancelPlan() {
    if (!confirm("Cancel your Pro plan and move to Starter? You can upgrade again anytime.")) return;
    setCancelling(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ plan: "Starter" }).eq("id", profile.id);
    setCancelling(false);
    router.refresh();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-base-border bg-base-card p-6">
        <div>
          <h3 className="font-medium text-ink-primary">Profile</h3>
          <p className="mt-1 text-sm text-ink-secondary">Update your name and how we contact you.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-ink-secondary">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-base-border bg-base-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-ink-secondary">Email</label>
          <input
            type="email"
            value={profile.email || ""}
            disabled
            className="w-full rounded-xl border border-base-border bg-base-surface/50 px-4 py-2.5 text-sm text-ink-muted outline-none"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            To change your email, contact support — this keeps your account secure.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-base-border bg-base-surface px-4 py-3">
          <div>
            <p className="text-sm text-ink-primary">Email notifications</p>
            <p className="text-xs text-ink-muted">Get notified about analysis results and account activity.</p>
          </div>
          <button
            type="button"
            onClick={() => setNotifications(!notifications)}
            className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
              notifications ? "bg-brand" : "bg-base-border"
            }`}
          >
            <span
              className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform ${
                notifications ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && <span className="text-sm text-accent-green">Saved.</span>}
        </div>
      </form>

      <div className="space-y-4 rounded-2xl border border-base-border bg-base-card p-6">
        <div>
          <h3 className="font-medium text-ink-primary">Plan</h3>
          <p className="mt-1 text-sm text-ink-secondary">
            You&apos;re currently on the <span className="text-ink-primary">{profile.plan}</span> plan.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push("/billing")}>
            Manage billing
          </Button>
          {profile.plan !== "Starter" && (
            <Button variant="ghost" onClick={handleCancelPlan} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel plan"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-base-border bg-base-card p-6">
        <h3 className="font-medium text-ink-primary">Account</h3>
        <div className="mt-4">
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
