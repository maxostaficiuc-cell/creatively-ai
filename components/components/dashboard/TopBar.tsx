"use client";

import { useRouter } from "next/navigation";
import { Bell, Zap, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function TopBar({
  profile,
  greeting,
  subtitle,
  onMenuClick,
}: {
  profile: Profile | null;
  greeting: string;
  subtitle: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = (profile?.full_name || "U").trim().charAt(0).toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 border-b border-base-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-ink-secondary lg:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">{greeting}</h1>
          <p className="text-sm text-ink-secondary">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-base-border bg-base-card px-3.5 py-2">
          <Zap size={15} className="text-accent-green" />
          <div>
            <p className="text-xs leading-none text-ink-secondary">AI Credits</p>
            <p className="mt-1 text-xs font-medium text-ink-primary">
              {(profile?.ai_credits ?? 0).toLocaleString()} / 10,000
            </p>
          </div>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-base-border bg-base-card text-ink-secondary hover:text-ink-primary"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-sm font-medium text-brand-light"
          >
            {initial}
          </button>
          {open && (
            <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-base-border bg-base-card p-1.5 shadow-xl">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-secondary hover:bg-base-surface hover:text-ink-primary"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
