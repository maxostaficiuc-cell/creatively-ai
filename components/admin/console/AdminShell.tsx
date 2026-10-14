"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Activity, BarChart3, Coins, CreditCard, LayoutGrid, LogOut, Menu, ScrollText, ShieldCheck, UserCog, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/credits", label: "Credits", icon: Coins },
  { href: "/admin/access", label: "Access", icon: ShieldCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/health", label: "System health", icon: Activity },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export function AdminShell({ email, role, children }: { email: string; role: "owner" | "admin" | "viewer"; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = role === "owner" ? [...NAV, { href: "/admin/admins", label: "Admins", icon: UserCog }] : NAV;
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5" aria-label="Admin">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={clsx(
            "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
            isActive(href) ? "bg-white/[0.07] text-white" : "text-ink-secondary hover:bg-white/[0.03] hover:text-white"
          )}
        >
          <Icon size={16} className={clsx("transition-colors", isActive(href) ? "text-brand-light" : "text-ink-muted group-hover:text-ink-secondary")} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-6 border-t border-white/[0.06] pt-4">
      <p className="truncate text-xs text-ink-secondary" title={email}>
        {email}
      </p>
      <p className="mt-0.5 text-[11px] capitalize text-ink-muted">{role === "viewer" ? "Viewer · read-only" : role}</p>
      <button
        type="button"
        onClick={async () => {
          await createClient().auth.signOut();
          router.push("/login?next=/admin");
          router.refresh();
        }}
        className="mt-3 inline-flex items-center gap-2 text-xs text-ink-muted transition-colors hover:text-white"
      >
        <LogOut size={13} /> Sign out
      </button>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <Image src="/logo-icon.png" alt="" width={26} height={26} className="rounded-md" />
      <span className="text-[15px] font-semibold tracking-tight text-white">
        creatively<span className="text-brand-light">.ai</span>
      </span>
      <span className="rounded-md border border-brand/30 bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-light">Admin</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#050507] text-ink-primary">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.06] bg-[#08080B] px-4 py-5 lg:flex">
        <div className="mb-7 px-1">{brand}</div>
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#050507]/90 px-4 py-3 backdrop-blur lg:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-secondary hover:text-white" aria-label="Open admin menu">
          <Menu size={20} />
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/[0.06] bg-[#08080B] px-4 py-5">
            <div className="mb-7 flex items-center justify-between px-1">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-secondary hover:text-white" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      ) : null}

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</div>
      </main>
    </div>
  );
}
