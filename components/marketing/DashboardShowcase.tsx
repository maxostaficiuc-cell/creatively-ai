export function DashboardShowcase({
  label,
  caption,
}: {
  label?: string;
  caption?: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      {label && (
        <p className="text-center text-xs font-medium uppercase tracking-wide text-brand-light">
          {label}
        </p>
      )}
      <div className={`group relative ${label ? "mt-6" : ""}`}>
        <div
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.35), transparent)" }}
        />
        <div className="overflow-hidden rounded-2xl border border-base-border bg-base-card shadow-glow transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:brightness-110">
          {/* Save your real dashboard screenshot to public/dashboard-screenshot.png
              and it will appear here automatically. */}
          <img
            src="/dashboard-screenshot.png"
            alt="The Creatively.ai dashboard — Overview, Analyze Creative, Winning Ads, My Creatives, Campaigns, Ad Sets, Ads, Insights, AI Credits, Connected Accounts, Performance Overview with Spend, Revenue and ROAS"
            className="w-full"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 -bottom-10 h-24"
          style={{ background: "linear-gradient(to bottom, transparent, #0A0A0D)" }}
        />
      </div>
      {caption && (
        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink-secondary">{caption}</p>
      )}
    </div>
  );
}
