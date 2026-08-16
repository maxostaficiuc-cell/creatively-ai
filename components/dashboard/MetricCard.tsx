import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  positive = true,
  iconClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  iconClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-base-border bg-base-card p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-brand-light ${
            iconClass || ""
          }`}
        >
          <Icon size={16} />
        </div>
        <p className="text-sm text-ink-secondary">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-semibold text-ink-primary">{value}</p>
      {delta && (
        <p
          className={`mt-1 flex items-center gap-1 text-xs ${
            positive ? "text-accent-green" : "text-accent-red"
          }`}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta} vs last 30 days
        </p>
      )}
    </div>
  );
}
