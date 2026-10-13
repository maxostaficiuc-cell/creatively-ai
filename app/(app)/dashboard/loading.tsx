// Skeleton shaped like the Overview, shown while the server loads your analyses.
export default function Loading() {
  const block = "rounded-2xl border border-base-border bg-base-card";
  return (
    <div className="flex min-h-screen bg-base-bg" aria-busy="true" aria-label="Loading your overview">
      <div className="hidden w-64 shrink-0 border-r border-base-border bg-base-surface lg:block" />
      <div className="flex-1 animate-pulse px-6 py-6">
        <div className="h-6 w-56 rounded bg-base-card" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-base-card" />
        <div className="mx-auto mt-8 max-w-6xl space-y-8">
          <div className="flex gap-3">
            <div className="h-10 w-40 rounded-xl bg-base-card" />
            <div className="h-10 w-32 rounded-xl bg-base-card" />
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className={`${block} h-80 lg:col-span-3`} />
            <div className={`${block} h-80 lg:col-span-2`} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`${block} h-64`} />
            <div className={`${block} h-64`} />
          </div>
          <div className={`${block} h-72`} />
        </div>
      </div>
    </div>
  );
}
