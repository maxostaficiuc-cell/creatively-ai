// Presentational building blocks for the admin console (server-safe, no client JS).
import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Info } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-white">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, subtitle, children, className, actions, bodyClassName }: { title?: ReactNode; subtitle?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode; bodyClassName?: string }) {
  return (
    <section className={clsx("rounded-2xl border border-white/[0.06] bg-white/[0.015]", className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.05] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={clsx(bodyClassName ?? "p-5")}>{children}</div>
    </section>
  );
}

/** A KPI. `source` says exactly where the number comes from. */
export function Stat({ label, value, sub, source, tone, unavailable }: { label: string; value: ReactNode; sub?: ReactNode; source: string; tone?: "warn" | "bad" | "good"; unavailable?: boolean }) {
  return (
    <div className="group relative flex min-h-[124px] flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 transition-colors hover:border-white/[0.1]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</p>
        <span className="relative">
          <Info size={13} className="text-ink-muted/70" aria-hidden />
          <span role="tooltip" className="pointer-events-none absolute right-0 top-5 z-20 w-64 rounded-lg border border-white/10 bg-[#121218] p-3 text-[11px] normal-case leading-relaxed tracking-normal text-ink-secondary opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {source}
          </span>
        </span>
      </div>
      <p
        className={clsx(
          "mt-2 text-[26px] font-semibold tabular-nums tracking-tight",
          unavailable ? "text-base text-ink-muted" : tone === "bad" ? "text-rose-300" : tone === "warn" ? "text-amber-200" : tone === "good" ? "text-emerald-300" : "text-white"
        )}
      >
        {value}
      </p>
      {sub ? <div className="mt-auto pt-1 text-xs text-ink-secondary">{sub}</div> : null}
      <span className="sr-only">Source: {source}</span>
    </div>
  );
}

const BADGE: Record<string, string> = {
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  red: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  purple: "border-brand/30 bg-brand/10 text-brand-light",
  gray: "border-white/10 bg-white/[0.04] text-ink-secondary",
};
export function Badge({ children, color = "gray" }: { children: ReactNode; color?: keyof typeof BADGE }) {
  return <span className={clsx("inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium", BADGE[color])}>{children}</span>;
}

export function subscriptionBadge(status: string | null | undefined, cancelAtPeriodEnd?: boolean | null) {
  if (!status) return <Badge>No profile</Badge>;
  if (status === "active") return <Badge color="green">{cancelAtPeriodEnd ? "Active · canceling" : "Active"}</Badge>;
  if (status === "past_due") return <Badge color="amber">Past due</Badge>;
  if (status === "cancelled") return <Badge color="red">Cancelled</Badge>;
  if (status === "unpaid") return <Badge>Unpaid</Badge>;
  return <Badge>{status}</Badge>;
}
export function accessBadge(status: string | null | undefined, long = false) {
  return status === "suspended" ? <Badge color="red">{long ? "Access suspended" : "Suspended"}</Badge> : <Badge color="gray">{long ? "Access active" : "Active"}</Badge>;
}

/** "balance: 10,300 → 10,550 · bonus credits: 300 → 550" from audit before/after values. */
export function describeChange(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  if (!keys.length) return "—";
  const v = (x: unknown) => (typeof x === "number" ? x.toLocaleString("en-US") : x == null ? "—" : String(x));
  return keys
    .map((k) => {
      const label = k.replace(/_/g, " ");
      if (!before || !(k in before)) return `${label}: ${v(after?.[k])}`;
      return `${label}: ${v(before[k])} → ${v(after?.[k])}`;
    })
    .join(" · ");
}

export function Table({ head, children, empty, minWidth = 720 }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode; minWidth?: number }) {
  return (
    <div className="-mx-px overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-white/[0.06]">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
export function Td({ children, className, mono }: { children: ReactNode; className?: string; mono?: boolean }) {
  return <td className={clsx("whitespace-nowrap px-4 py-3 align-middle text-ink-secondary", mono && "font-mono text-[12px]", className)}>{children}</td>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 h-9 w-9 rounded-full border border-white/10 bg-white/[0.03]" />
      <p className="text-sm font-medium text-white">{title}</p>
      {children ? <div className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-muted">{children}</div> : null}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "error"; title?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
        tone === "error" ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-200" : tone === "warn" ? "border-amber-300/20 bg-amber-300/[0.05] text-amber-100" : "border-brand/20 bg-brand/[0.06] text-ink-secondary"
      )}
    >
      {title ? <p className="mb-0.5 font-medium text-white">{title}</p> : null}
      {children}
    </div>
  );
}

export function Segmented({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <nav className="inline-flex rounded-xl border border-white/[0.07] bg-white/[0.02] p-1" aria-label="Filter">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          aria-current={it.key === active ? "page" : undefined}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            it.key === active ? "bg-white/[0.09] text-white shadow-sm" : "text-ink-secondary hover:text-white"
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

export function Pager({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] px-4 py-3 text-xs text-ink-muted">
      <span className="tabular-nums">
        {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
      </span>
      <div className="flex gap-2">
        <PagerLink disabled={page <= 1} href={hrefFor(page - 1)}>
          Previous
        </PagerLink>
        <PagerLink disabled={page >= pages} href={hrefFor(page + 1)}>
          Next
        </PagerLink>
      </div>
    </div>
  );
}
function PagerLink({ disabled, href, children }: { disabled: boolean; href: string; children: ReactNode }) {
  if (disabled) return <span className="rounded-lg border border-white/[0.05] px-3 py-1.5 text-ink-muted/50">{children}</span>;
  return (
    <Link href={href} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-ink-secondary transition-colors hover:border-white/20 hover:text-white">
      {children}
    </Link>
  );
}

export function KeyVal({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[11px] uppercase tracking-[0.06em] text-ink-muted">{k}</dt>
          <dd className="mt-0.5 truncate text-[13px] text-white">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Builds a URL with updated query params (server-side helper). */
export function withParams(base: string, current: Record<string, string | undefined>, patch: Record<string, string | undefined | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v != null && v !== "") p.set(k, String(v));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}
