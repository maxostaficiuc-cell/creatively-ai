export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-ink-secondary">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-border border-t-brand-light" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-base-card ${className}`} />;
}
