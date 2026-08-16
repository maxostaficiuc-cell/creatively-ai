export function CreativeCard({
  title,
  score,
  roas,
  spend,
  platform,
}: {
  title: string;
  score: number;
  roas: string;
  spend: string;
  platform: string;
}) {
  const scoreColor =
    score >= 85 ? "text-accent-green border-accent-green/40" : score >= 70 ? "text-brand-light border-brand/40" : "text-accent-red border-accent-red/40";

  return (
    <div className="shrink-0 w-64 overflow-hidden rounded-2xl border border-base-border bg-base-card">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-base-surface to-base-card px-4 text-center text-sm font-semibold uppercase tracking-tight text-ink-primary">
        {title}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-ink-secondary">
          <span>{platform}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${scoreColor}`}>
            {score}
          </span>
          <div className="text-right">
            <p className="text-xs text-ink-muted">ROAS</p>
            <p className="text-sm font-medium text-ink-primary">{roas}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-muted">Spend</p>
            <p className="text-sm font-medium text-ink-primary">{spend}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
