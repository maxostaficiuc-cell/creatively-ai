// Presentational pieces that mirror the real Creative Strategy screens, sized in
// `em` so each host (How It Works window, showcase, feature card) sets the scale
// with its own font-size. Animation is added by the host via classes / CSS vars.
import { Globe, Instagram, Sparkles } from "lucide-react";
import { BASIS_LABEL, type Basis } from "@/lib/strategyShowcase";

const BASIS_CLS: Record<Basis, string> = {
  verified: "border-emerald-400/30 text-emerald-300",
  inferred: "border-brand/40 text-brand-light",
  assumption: "border-amber-400/40 text-amber-300",
};

export function BasisBadge({ basis }: { basis: Basis }) {
  return <span className={`whitespace-nowrap rounded-full border px-[0.55em] py-[0.1em] text-[0.72em] font-medium ${BASIS_CLS[basis]}`}>{BASIS_LABEL[basis]}</span>;
}

/** A URL field like the real brand input. `valueClassName` lets the host animate the typed value. */
export function UrlField({ kind, label, value, valueClassName = "", className = "" }: { kind: "web" | "social"; label: string; value: string; valueClassName?: string; className?: string }) {
  const Icon = kind === "web" ? Globe : Instagram;
  return (
    <div className={className}>
      <p className="text-[0.72em] font-medium text-ink-secondary">{label}</p>
      <div className="mt-[0.4em] flex items-center gap-[0.55em] rounded-[0.7em] border border-white/[0.09] bg-black/30 px-[0.75em] py-[0.6em]">
        <Icon className="h-[1em] w-[1em] shrink-0 text-ink-muted" aria-hidden />
        <span className="relative min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[0.85em] text-ink-primary">
          <span className={`inline-block ${valueClassName}`}>{value}</span>
        </span>
      </div>
    </div>
  );
}

export function AnalyzeButton({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center gap-[0.45em] rounded-[0.7em] bg-gradient-to-b from-brand-light to-brand px-[1em] py-[0.6em] text-[0.82em] font-semibold text-white ${className}`}>
      <Sparkles className="h-[1em] w-[1em]" aria-hidden /> Analyze My Brand
    </span>
  );
}

export function SnapshotRow({ label, value, basis, className = "", style }: { label: string; value: string; basis: Basis; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-[0.6em] border border-white/[0.06] bg-white/[0.02] px-[0.7em] py-[0.5em] ${className}`} style={style}>
      <div className="flex items-center justify-between gap-[0.5em]">
        <span className="truncate text-[0.72em] uppercase tracking-[0.06em] text-ink-muted">{label}</span>
        <BasisBadge basis={basis} />
      </div>
      <p className="mt-[0.2em] truncate text-[0.82em] text-ink-primary">{value}</p>
    </div>
  );
}

export function ConceptCard({ angle, name, hook, selected = false, className = "", style }: { angle: string; name: string; hook: string; selected?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-[0.7em] border px-[0.8em] py-[0.6em] ${selected ? "border-brand/60 bg-brand/[0.12] shadow-[0_0_2.2em_-0.8em_rgba(139,92,246,0.8)]" : "border-white/[0.08] bg-white/[0.025]"} ${className}`}
      style={style}
    >
      <p className={`text-[0.7em] font-semibold uppercase tracking-[0.12em] ${selected ? "text-brand-light" : "text-ink-muted"}`}>{angle}</p>
      <p className="mt-[0.15em] truncate text-[0.88em] font-semibold text-ink-primary">{name}</p>
      <p className="mt-[0.1em] truncate text-[0.74em] text-ink-secondary">“{hook}”</p>
    </div>
  );
}

export function IllustrationTag({ children = "Illustration", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-[0.6em] py-[0.15em] text-[0.7em] font-medium uppercase tracking-wide text-ink-muted ${className}`}>
      {children}
    </span>
  );
}
