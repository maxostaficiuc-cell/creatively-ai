"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";

/* ── Section shell ───────────────────────────────────────────────────────── */

export function ReportSection({
  id,
  index,
  title,
  kicker,
  children,
  aside,
}: {
  id: string;
  index: number;
  title: string;
  /** One line under the title saying what the section is for. */
  kicker?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section id={id} data-report-section aria-labelledby={`${id}-h`} className="rp-section">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3" data-rv>
        <div>
          <p className="rp-eyebrow">
            <span className="tabular-nums">{String(index).padStart(2, "0")}</span>
            <span aria-hidden className="mx-2 inline-block h-px w-5 translate-y-[-3px] bg-current opacity-40" />
            {title}
          </p>
          {kicker && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">{kicker}</p>}
        </div>
        {aside}
      </header>
      <h2 id={`${id}-h`} className="sr-only">
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ── Small labels ────────────────────────────────────────────────────────── */

type Tone = "green" | "red" | "amber" | "brand" | "neutral";
const TONE: Record<Tone, string> = {
  green: "border-accent-green/30 bg-accent-green/10 text-accent-green",
  red: "border-accent-red/30 bg-accent-red/10 text-[#F87171]",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  brand: "border-brand/30 bg-brand/10 text-brand-light",
  neutral: "border-white/10 bg-white/[0.04] text-ink-secondary",
};

export function Tag({ tone = "neutral", children, className = "" }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const PRIORITY_TONE: Record<string, Tone> = { High: "red", Medium: "amber", Low: "neutral" };
export const EFFORT_TONE: Record<string, Tone> = { Quick: "green", Moderate: "neutral", Substantial: "amber" };

/** A labelled line inside a card: "Observed", "Why it matters", "Fix" and so on. */
export function Field({
  label,
  children,
  muted = false,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  if (children == null || children === "") return null;
  return (
    <div className="rp-field">
      <dt className="rp-field-label">{label}</dt>
      <dd className={`text-sm leading-relaxed ${muted ? "text-ink-secondary" : "text-ink-primary/90"}`}>{children}</dd>
    </div>
  );
}

/* ── Copy button ─────────────────────────────────────────────────────────── */

export function CopyButton({
  text,
  label = "Copy",
  className = "",
  compact = false,
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [done, setDone] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(t.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      ta.remove();
    }
    setDone(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setDone(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={compact ? `${label}: ${text.slice(0, 60)}` : undefined}
      className={`rp-btn-ghost ${compact ? "rp-btn-icon" : ""} ${className}`}
    >
      {done ? <Check size={14} aria-hidden className="text-accent-green" /> : <Copy size={14} aria-hidden />}
      {!compact && <span>{done ? "Copied" : label}</span>}
      <span className="sr-only" aria-live="polite">
        {done ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}

/* ── Accordion (height animates via grid rows) ───────────────────────────── */

export function Expandable({
  open,
  children,
  id,
}: {
  open: boolean;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="rp-collapse" data-open={open ? "" : undefined} aria-hidden={!open}>
      <div className="min-h-0 overflow-hidden" {...(!open ? { inert: "" as unknown as boolean } : {})}>
        {children}
      </div>
    </div>
  );
}

export function ToggleRow({
  open,
  onClick,
  children,
  controls,
  className = "",
}: {
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
  controls?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary transition-colors hover:text-ink-primary ${className}`}
    >
      {children}
      <ChevronDown size={14} aria-hidden className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  const id = useId();
  return { open, setOpen, toggle: () => setOpen((o) => !o), id };
}

/** Bulleted list with a thin marker, for audience traits and similar. */
export function MiniList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-primary/90">
          <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
          {x}
        </li>
      ))}
    </ul>
  );
}

/** Shows nothing for empty strings, so legacy reports don't render blank rows. */
export function has(...v: (string | undefined | null)[]) {
  return v.some((x) => x && x.trim());
}
