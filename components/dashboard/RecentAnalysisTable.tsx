import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { FileSearch } from "lucide-react";

export type AnalysisRow = {
  creative: string;
  platform: string;
  score: number;
  insight: string;
  date: string;
};

export function RecentAnalysisTable({ rows }: { rows: AnalysisRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<FileSearch size={20} />}
        title="You haven't analyzed any creatives yet"
        description="Upload your first ad to get an AI-powered breakdown of what's working."
        action={<ButtonLink href="/analyze">Analyze Your First Creative</ButtonLink>}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-muted">
            <th className="pb-3 font-medium">Creative</th>
            <th className="pb-3 font-medium">Platform</th>
            <th className="pb-3 font-medium">Score</th>
            <th className="pb-3 font-medium">Insights</th>
            <th className="pb-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-border">
          {rows.map((r) => (
            <tr key={r.creative + r.date}>
              <td className="py-3 text-ink-primary">{r.creative}</td>
              <td className="py-3 text-ink-secondary">{r.platform}</td>
              <td className="py-3 text-ink-primary">{r.score}</td>
              <td className="py-3 text-ink-secondary">{r.insight}</td>
              <td className="py-3 text-ink-muted">{r.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
