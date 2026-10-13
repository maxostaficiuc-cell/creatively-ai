import Link from "next/link";
import { Megaphone } from "lucide-react";

// Shown on Campaigns / Ad Sets / Ads / Insights when no ad account is connected.
// Honest about availability: integrations aren't live yet, so this links to
// Ad Performance (which explains the status) instead of a connect flow.
export function ConnectAdAccountEmptyState() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-base-border bg-base-surface/40 px-8 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand-light">
        <Megaphone size={24} />
      </div>
      <h3 className="text-lg font-medium text-ink-primary">No ad account connected</h3>
      <p className="mt-2 text-sm text-ink-secondary">
        Campaign data appears here once you connect an advertising account. Account integrations are coming soon — no
        campaign numbers are shown until then.
      </p>
      <Link
        href="/accounts"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-base-border px-6 py-3 text-sm font-medium text-ink-primary transition-colors hover:border-brand/40"
      >
        See integration status
      </Link>
    </div>
  );
}
