import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

type Tone = "green" | "red" | "purple";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  green: { bg: "bg-accent-green/15", text: "text-accent-green" },
  red: { bg: "bg-accent-red/15", text: "text-accent-red" },
  purple: { bg: "bg-brand/15", text: "text-brand-light" },
};

export function CreativeInsightCard({
  icon: Icon,
  tone,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description: string;
  href: string;
}) {
  const t = toneStyles[tone];
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-base-border bg-base-surface p-4 transition-colors hover:border-brand/40"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.bg} ${t.text}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${t.text}`}>{title}</p>
        <p className="mt-1 text-xs text-ink-secondary">{description}</p>
      </div>
      <ArrowRight size={14} className="mt-1 shrink-0 text-ink-muted" />
    </Link>
  );
}
