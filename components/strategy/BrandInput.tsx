"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, Globe, ImagePlus, Instagram, Sparkles, X } from "lucide-react";
import { CONTEXT_FIELDS, DAILY_ANALYSIS_LIMIT, type SourceReport } from "@/lib/strategyTypes";

export type InputState = { websiteUrl: string; socialUrl: string; context: Record<string, string>; notes: string; files: File[] };

const looksLikeUrl = (v: string) => /^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/i.test(v.trim());

export function BrandInput({
  value,
  onChange,
  onSubmit,
  fieldErrors,
  error,
  sourceProblem,
  disabled,
  disabledReason,
  rerun,
}: {
  value: InputState;
  onChange: (v: InputState) => void;
  onSubmit: () => void;
  fieldErrors: Record<string, string>;
  error: string | null;
  sourceProblem: { sources: SourceReport[]; fallback: string } | null;
  disabled: boolean;
  disabledReason: "plan" | "ai" | null;
  rerun?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(Object.values(value.context).some(Boolean));
  const [fallbackOpen, setFallbackOpen] = useState(!!sourceProblem || !!value.notes || value.files.length > 0);
  const set = (patch: Partial<InputState>) => onChange({ ...value, ...patch });
  const hasOne = looksLikeUrl(value.websiteUrl) || looksLikeUrl(value.socialUrl);
  const showFallback = fallbackOpen || !!sourceProblem;

  return (
    <section className="mx-auto max-w-2xl pt-2 sm:pt-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-light">
          <Sparkles size={12} /> Creative Strategy
        </span>
        <h1 className="mt-4 text-[1.9rem] font-semibold leading-tight tracking-tight text-ink-primary sm:text-4xl">Let&apos;s build your next winning creative.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-secondary sm:text-base">
          Tell us about your business. We&apos;ll analyze your brand, develop an advertising strategy, and help you turn the best ideas into ad creatives.
        </p>
      </div>

      <form
        className="cs-card mt-8 rounded-2xl border border-base-border bg-base-card p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && hasOne) onSubmit();
        }}
        noValidate
      >
        <UrlField id="websiteUrl" label="Website URL" icon={<Globe size={15} />} placeholder="https://yourbrand.com" value={value.websiteUrl} onChange={(v) => set({ websiteUrl: v })} error={fieldErrors.websiteUrl} />
        <div className="mt-4">
          <UrlField id="socialUrl" label="Social media profile URL" icon={<Instagram size={15} />} placeholder="https://instagram.com/yourbrand" value={value.socialUrl} onChange={(v) => set({ socialUrl: v })} error={fieldErrors.socialUrl} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">Either one is enough. Providing both usually gives the AI more context.</p>

        {sourceProblem && (
          <div role="alert" className="mt-5 rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm">
            <p className="flex items-start gap-2 font-medium text-ink-primary">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-accent-red" /> We couldn&apos;t read enough about your brand.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-ink-secondary">
              {sourceProblem.sources.map((s, i) => (
                <li key={i}>
                  <span className="text-ink-primary">{s.kind === "website" ? "Website" : s.platform ?? "Profile"}:</span> {s.note}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-secondary">{sourceProblem.fallback}</p>
          </div>
        )}

        {/* Fallback when a profile can't be read */}
        <div className="mt-5 border-t border-base-border pt-4">
          <button type="button" onClick={() => setFallbackOpen(!fallbackOpen)} className="flex w-full items-center justify-between text-left text-sm text-ink-secondary hover:text-ink-primary" aria-expanded={showFallback}>
            Profile text or screenshots <span className="text-xs text-ink-muted">optional — helps when a profile is private</span>
            <ChevronDown size={15} className={`ml-2 shrink-0 transition-transform ${showFallback ? "rotate-180" : ""}`} />
          </button>
          {showFallback && (
            <div className="cs-reveal mt-3 space-y-3">
              <textarea
                value={value.notes}
                onChange={(e) => set({ notes: e.target.value.slice(0, 4000) })}
                rows={3}
                placeholder="Paste your bio and a few recent captions…"
                className="w-full rounded-xl border border-base-border bg-base-surface px-3 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand/50 focus:outline-none"
              />
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-base-border px-3 py-2 text-sm text-ink-secondary hover:border-brand/40 hover:text-ink-primary">
                  <ImagePlus size={15} /> Add screenshots (up to 4)
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(e) => set({ files: [...value.files, ...Array.from(e.target.files ?? [])].slice(0, 4) })}
                  />
                </label>
                {value.files.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {value.files.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 rounded-lg bg-base-surface px-2 py-1 text-xs text-ink-secondary">
                        {f.name.slice(0, 28)}
                        <button type="button" aria-label={`Remove ${f.name}`} onClick={() => set({ files: value.files.filter((_, j) => j !== i) })} className="text-ink-muted hover:text-ink-primary">
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-base-border pt-4">
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} className="flex w-full items-center justify-between text-left text-sm text-ink-secondary hover:text-ink-primary" aria-expanded={moreOpen}>
            Additional context <span className="text-xs text-ink-muted">optional — the AI will infer what it can</span>
            <ChevronDown size={15} className={`ml-2 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          {moreOpen && (
            <div className="cs-reveal mt-3 grid gap-3 sm:grid-cols-2">
              {CONTEXT_FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs text-ink-muted">{f.label}</span>
                  <input
                    value={value.context[f.key] ?? ""}
                    onChange={(e) => set({ context: { ...value.context, [f.key]: e.target.value.slice(0, 300) } })}
                    placeholder={f.placeholder}
                    className="mt-1 h-10 w-full rounded-xl border border-base-border bg-base-surface px-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand/50 focus:outline-none"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {error && !sourceProblem && (
          <p role="alert" className="mt-4 text-sm text-accent-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={disabled || !hasOne}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand text-sm font-semibold text-white shadow-glow transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={16} /> {rerun ? "Re-analyze & save new version" : "Analyze My Brand"}
        </button>
        <p className="mt-3 text-center text-xs text-ink-muted">
          {disabledReason === "plan"
            ? "Creative Strategy is available on an active plan."
            : disabledReason === "ai"
            ? "Brand analysis isn't available right now: the AI service isn't configured on the server."
            : `Brand analysis is free on your plan (up to ${DAILY_ANALYSIS_LIMIT} a day). Generating ad images uses credits — you'll see the cost before anything is charged.`}
        </p>
      </form>
    </section>
  );
}

function UrlField({ id, label, icon, placeholder, value, onChange, error }: { id: string; label: string; icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-ink-primary">{label}</span>
      <span className="relative mt-1.5 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">{icon}</span>
        <input
          id={id}
          type="url"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`h-12 w-full rounded-xl border bg-base-surface pl-9 pr-3 text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none ${error ? "border-accent-red/60" : "border-base-border focus:border-brand/50"}`}
        />
      </span>
      {error && (
        <span id={`${id}-err`} className="mt-1 block text-xs text-accent-red">
          {error}
        </span>
      )}
    </label>
  );
}
