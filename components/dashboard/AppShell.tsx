"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  greeting,
  subtitle,
  children,
}: {
  profile: Profile | null;
  greeting: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base-bg">
      <div className="hidden lg:block">
        <Sidebar profile={profile} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 bg-base-surface">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="text-ink-secondary" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <Sidebar profile={profile} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar profile={profile} greeting={greeting} subtitle={subtitle} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
