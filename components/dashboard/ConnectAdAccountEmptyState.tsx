import Link from "next/link";
import { Megaphone } from "lucide-react";

export function ConnectAdAccountEmptyState() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-base-border bg-base-surface/40 px-8 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand-light">
        <Megaphone size={24} />
      </div>
      <h3 className="text-lg font-medium text-ink-primary">Connect your advertising account</h3>
      <p className="mt-2 text-sm text-ink-secondary">
        Connect your Meta Ads account to unlock real campaign performance, spend, revenue, ROAS
        and creative insights.
      </p>
      <Link
        href="/accounts"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-6 py-3 text-sm font-medium text-white shadow-glow hover:brightness-110"
      >
        Connect Meta Ads
      </Link>
    </div>
  );
}
