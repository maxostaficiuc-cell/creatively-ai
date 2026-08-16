import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

export type AccountStatus = { name: string; connected: boolean };

export function AccountStatusCard({ accounts }: { accounts: AccountStatus[] }) {
  return (
    <div className="rounded-2xl border border-base-border bg-base-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-ink-primary">Account Status</h3>
        <Link href="/accounts" className="text-xs text-brand-light hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {accounts.map((a) => (
          <div key={a.name} className="flex items-center justify-between rounded-xl border border-base-border bg-base-surface px-4 py-3">
            <span className="text-sm text-ink-primary">{a.name}</span>
            {a.connected ? (
              <span className="flex items-center gap-1.5 rounded-full bg-accent-green/10 px-2.5 py-1 text-xs text-accent-green">
                <CheckCircle2 size={12} /> Connected
              </span>
            ) : (
              <Link
                href="/accounts"
                className="flex items-center gap-1.5 rounded-full border border-base-border px-2.5 py-1 text-xs text-ink-secondary hover:text-ink-primary"
              >
                <Circle size={12} /> Not Connected
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
