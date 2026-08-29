import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CreativeThumb } from "@/components/dashboard/CreativeThumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { Creative } from "@/lib/types";

function verdictLabel(score: number | null): string {
  if (score === null) return "";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Weak";
  return "Very Weak";
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function RecentAnalysesGrid({ creatives }: { creatives: Creative[] }) {
  return (
    <div>
      <h2 className="font-medium text-ink-primary">Recent Analyses</h2>
      <p className="mt-1 text-sm text-ink-secondary">Your latest creative intelligence reports.</p>

      {creatives.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No analyses yet"
            description="Analyze your first creative to see it appear here."
            action={<ButtonLink href="/analyze">Analyze Creative</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creatives.map((c) => (
            <Link
              key={c.id}
              href={`/my-creatives/${c.id}`}
              className="group overflow-hidden rounded-2xl border border-base-border bg-base-card transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand/30 hover:shadow-glow"
            >
              <div className="overflow-hidden">
                <CreativeThumb
                  url={c.file_url}
                  fileType={c.file_type}
                  className="h-40 w-full rounded-none transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/40 text-xs font-semibold text-brand-light">
                    {c.score ?? "—"}
                  </span>
                  <span className="text-xs text-ink-muted">{verdictLabel(c.score)}</span>
                </div>
                <p className="mt-3 truncate text-sm font-medium text-ink-primary">
                  {c.summary || "Analyzed creative"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {c.platform || "Meta Ads"} · {c.file_type === "video" ? "Video" : "Static"}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-base-border pt-3 text-xs">
                  <span className="text-ink-muted">Analyzed {timeAgo(c.created_at)}</span>
                  <span className="flex items-center gap-1 text-brand-light opacity-0 transition-opacity group-hover:opacity-100">
                    View Analysis
                    <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
