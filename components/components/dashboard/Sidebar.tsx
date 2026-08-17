"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Sparkles,
  Trophy,
  FolderOpen,
  BarChart2,
  Layers,
  Megaphone,
  LineChart,
  Link2,
  CreditCard,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { Profile } from "@/lib/types";

const mainLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/analyze", label: "Analyze Creative", icon: Sparkles },
  { href: "/winning-ads", label: "Winning Ads", icon: Trophy },
  { href: "/my-creatives", label: "My Creatives", icon: FolderOpen },
];

const perfLinks = [
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/ad-sets", label: "Ad Sets", icon: Layers },
  { href: "/ads", label: "Ads", icon: BarChart2 },
  { href: "/insights", label: "Insights", icon: LineChart },
];

const connectLinks = [{ href: "/accounts", label: "Ad Accounts", icon: Link2 }];

const accountLinks = [
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavSection({
  title,
  links,
  pathname,
}: {
  title: string;
  links: typeof mainLinks;
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      <nav className="mt-2 space-y-0.5">
        {links.map((l) => {
          const active = pathname === l.href;
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand/15 text-ink-primary"
                  : "text-ink-secondary hover:bg-base-surface hover:text-ink-primary"
              }`}
            >
              <Icon size={16} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const credits = profile?.ai_credits ?? 0;
  const creditLimit = 10000;
  const pct = Math.min(100, Math.round((credits / creditLimit) * 100));

  const displayName = profile?.full_name || "there";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-base-border bg-base-surface px-4 py-5">
      <div className="px-2">
        <Logo href="/dashboard" />
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-8 overflow-y-auto scrollbar-thin">
        <NavSection title="Main" links={mainLinks} pathname={pathname} />
        <NavSection title="Ad Performance" links={perfLinks} pathname={pathname} />
        <NavSection title="Connect" links={connectLinks} pathname={pathname} />
        <NavSection title="Account" links={accountLinks} pathname={pathname} />
      </div>

      <div className="mt-4 space-y-4 border-t border-base-border pt-4">
        <div className="rounded-xl border border-base-border bg-base-card p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Your plan
            </p>
            <Link href="/billing" className="text-xs font-medium text-brand-light hover:underline">
              Upgrade
            </Link>
          </div>
          <p className="mt-1 text-sm font-medium text-ink-primary">{profile?.plan || "Pro"}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-secondary">
            <span>AI Credits</span>
            <span>
              {credits.toLocaleString()} / {creditLimit.toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-base-border">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-base-card"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-medium text-brand-light">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-ink-primary">{displayName}</p>
            <p className="truncate text-xs text-ink-muted">{profile?.email}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
