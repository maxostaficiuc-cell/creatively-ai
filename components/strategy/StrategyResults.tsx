"use client";

import { useState } from "react";
import { AlertTriangle, Check, Info, Pencil, RefreshCcw, Sparkles, Users, Lightbulb, Target, X, Loader2 } from "lucide-react";
import { Generator, Gallery } from "@/components/strategy/Generator";
import { PROFILE_FIELDS, type Basis, type Concept, type Generation, type Strategy } from "@/lib/strategyTypes";

const BASIS_UI: Record<Basis, { label: string; cls: string; help: string }> = {
  verified: { label: "Verified", cls: "border-accent-green/30 text-accent-green", help: "Stated on your website or profile." },
  inferred: { label: "Inferred", cls: "border-brand/40 text-brand-light", help: "A reasonable reading of what we could see." },
  assumption: { label: "Needs confirmation", cls: "border-amber-400/40 text-amber-300", help: "A guess, or not found — please check it." },
  confirmed: { label: "Confirmed by you", cls: "border-white/20 text-ink-primary", help: "You provided or corrected this." },
};

export function StrategyResults({
  strategy,
  generations,
  setGenerations,
  imagesReady,
  creditCost,
  onStrategy,
  onRevised,
  onReanalyze,
}: {
  strategy: Strategy;
  generations: Generation[];
  setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>;
  imagesReady: boolean;
  creditCost: number;
  onStrategy: (s: Strategy) => void;
  onRevised: (s: Strategy) => void;
  onReanalyze: () => void;
}) {
  const p = strategy.brand_profile!;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [genFor, setGenFor] = useState<string | null>(null); // concept id, or "" = choose
  const [editConcept, setEditConcept] = useState<Concept | null>(null);

  const saveEdits = async () => {
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/strategy/${strategy.id}/revise`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: draft }) });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setErr(j.error ?? "Couldn't save.");
    setEditing(false);
    setDraft({});
    onRevised(j.strategy);
  };

  return (
    <div className="space-y-10">
      {/* header */}
      <header className="cs-reveal">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-light">Brand strategy · v{strategy.version}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">{strategy.brand_name ?? "Your brand"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-secondary">{p.summary}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {strategy.sources.map((s, i) => (
            <li key={i} title={s.note} className={`max-w-full rounded-full border px-3 py-1 text-xs ${s.status === "retrieved" || s.status === "provided" ? "border-accent-green/30 text-accent-green" : s.status === "partial" ? "border-amber-400/40 text-amber-300" : "border-accent-red/30 text-accent-red"}`}>
              <span className="truncate">
                {s.kind === "website" ? "Website" : s.kind === "social" ? s.platform : s.kind === "screenshots" ? "Screenshots" : "Your notes"} · {s.status === "retrieved" ? "read" : s.status === "provided" ? "provided" : s.status === "partial" ? "partly read" : "couldn't be read"}
              </span>
            </li>
          ))}
        </ul>
        {strategy.sources.some((s) => s.status !== "retrieved" && s.status !== "provided") && (
          <div className="mt-3 space-y-1 text-xs text-ink-muted">
            {strategy.sources
              .filter((s) => s.status !== "retrieved" && s.status !== "provided")
              .map((s, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <Info size={12} className="mt-0.5 shrink-0" /> {s.note}
                </p>
              ))}
          </div>
        )}
      </header>

      {/* A. Brand snapshot */}
      <section aria-labelledby="snap" className="cs-reveal" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle id="snap" icon={<Target size={15} />} title="Brand Snapshot" sub="What we found, and how sure we are about each point." />
          {!editing ? (
            <div className="flex gap-2">
              <button type="button" onClick={onReanalyze} className="inline-flex items-center gap-1.5 rounded-xl border border-base-border px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary">
                <RefreshCcw size={13} /> Re-analyze
              </button>
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-ink-primary hover:bg-brand/15">
                <Pencil size={13} /> Edit brand details
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditing(false); setDraft({}); }} className="rounded-xl border border-base-border px-3 py-2 text-sm text-ink-secondary">
                Cancel
              </button>
              <button type="button" disabled={saving || !Object.keys(draft).length} onClick={saveEdits} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save & update strategy
              </button>
            </div>
          )}
        </div>
        {editing && <p className="mt-2 text-xs text-ink-muted">Your corrections are saved as a new version and the audience and concepts are rebuilt from them. The current version stays saved.</p>}
        {err && <p className="mt-2 text-sm text-accent-red">{err}</p>}
        <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-base-border bg-base-border md:grid-cols-2">
          {PROFILE_FIELDS.map((f) => {
            const v = p.fields[f.key];
            const b = BASIS_UI[v.basis];
            return (
              <div key={f.key} className="bg-base-card p-4">
                <dt className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{f.label}</span>
                  <span title={b.help} className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${b.cls}`}>
                    {b.label}
                  </span>
                </dt>
                {editing ? (
                  <textarea
                    defaultValue={v.value}
                    rows={2}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-base-border bg-base-surface px-2.5 py-2 text-sm text-ink-primary focus:border-brand/50 focus:outline-none"
                  />
                ) : (
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                    {v.value}
                    {v.source && <span className="ml-1 text-xs text-ink-muted">· {v.source}</span>}
                  </dd>
                )}
              </div>
            );
          })}
          <div className="bg-base-card p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Brand colors</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {p.colors.length ? (
                p.colors.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 rounded-lg border border-base-border px-2 py-1 text-xs text-ink-secondary">
                    <span className="h-3.5 w-3.5 rounded" style={{ background: c }} /> {c}
                  </span>
                ))
              ) : (
                <span className="text-sm text-ink-muted">Not identified from the sources.</span>
              )}
            </dd>
          </div>
        </dl>
        {(p.products.length > 0 || p.discrepancies.length > 0 || p.missing_info.length > 0) && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {p.products.length > 0 && (
              <Panel title="Products & services">
                <ul className="space-y-1.5">
                  {p.products.map((x, i) => (
                    <li key={i}>
                      <span className="text-ink-primary">{x.name}</span> <span className="text-ink-muted">— {x.detail}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {p.discrepancies.length > 0 && (
              <Panel title="Website vs. social — doesn't match" tone="warn">
                <ul className="list-disc space-y-1 pl-4">
                  {p.discrepancies.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </Panel>
            )}
            {p.missing_info.length > 0 && (
              <Panel title="Missing — add it for better ads">
                <ul className="list-disc space-y-1 pl-4">
                  {p.missing_info.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        )}
      </section>

      {/* B. Audience */}
      {strategy.audience && (
        <section aria-labelledby="aud" className="cs-reveal" style={{ animationDelay: "120ms" }}>
          <SectionTitle id="aud" icon={<Users size={15} />} title="Audience Insights" sub="Segments worth testing — hypotheses from public information, not your customer data." />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {strategy.audience.map((a, i) => (
              <article key={i} className="cs-item rounded-2xl border border-base-border bg-base-card p-5" style={{ animationDelay: `${160 + i * 60}ms` }}>
                <h3 className="font-medium text-ink-primary">{a.name}</h3>
                <p className="mt-1 text-sm text-ink-secondary">{a.who}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row k="Problem or desire" v={a.problem_or_desire} />
                  <Row k="What could motivate them" v={a.motivation} />
                  <Row k="Message that may resonate" v={a.message} accent />
                  <Row k="Validate before spending" v={a.validate} />
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* C. Opportunities */}
      {strategy.opportunities && (
        <section aria-labelledby="opp" className="cs-reveal" style={{ animationDelay: "180ms" }}>
          <SectionTitle id="opp" icon={<Lightbulb size={15} />} title="Advertising Opportunities" sub="The angles that fit this brand — not every angle there is." />
          <ol className="mt-4 divide-y divide-base-border overflow-hidden rounded-2xl border border-base-border bg-base-card">
            {strategy.opportunities.map((o, i) => (
              <li key={i} className="grid gap-3 p-5 md:grid-cols-[180px_1fr]">
                <div>
                  <p className="text-[11px] tabular-nums text-ink-muted">0{i + 1}</p>
                  <h3 className="font-medium text-ink-primary">{o.angle}</h3>
                  <p className="mt-1 text-xs text-ink-muted">For {o.audience}</p>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-3">
                  <Row k="Core message" v={o.core_message} accent />
                  <Row k="Why test it" v={o.why_test} />
                  <Row k="Hypothesis" v={o.hypothesis} />
                </dl>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* D. Concepts */}
      {strategy.concepts && (
        <section aria-labelledby="con" className="cs-reveal" style={{ animationDelay: "240ms" }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle id="con" icon={<Sparkles size={15} />} title="Recommended Ad Concepts" sub={`${strategy.concepts.length} distinct concepts for static Meta ads.`} />
            <button
              type="button"
              onClick={() => setGenFor("")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-110"
            >
              <Sparkles size={15} /> Generate Ads
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {strategy.concepts.map((c, i) => (
              <article key={c.id} className="cs-item group flex flex-col rounded-2xl border border-base-border bg-base-card p-5 transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-[0_18px_40px_-26px_rgba(139,92,246,0.7)]" style={{ animationDelay: `${280 + i * 70}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brand-light">{c.angle}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug text-ink-primary">{c.name}</h3>
                  </div>
                  <button type="button" onClick={() => setEditConcept(c)} aria-label={`Edit ${c.name}`} className="rounded-lg p-1.5 text-ink-muted hover:bg-base-surface hover:text-ink-primary">
                    <Pencil size={14} />
                  </button>
                </div>
                <p className="mt-3 rounded-xl bg-base-surface px-3 py-2.5 text-[15px] font-medium leading-snug text-ink-primary">“{c.hook}”</p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <Row k="Audience" v={c.audience} />
                  <Row k="Main message" v={c.message} />
                  <Row k="Visual" v={c.visual} />
                  <Row k="Emphasize" v={c.emphasis} />
                  <Row k="CTA" v={c.cta} />
                  <Row k="Placement" v={c.placement} />
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                  <span className="text-ink-secondary">Why test it:</span> {c.why}
                </p>
                {c.needs_confirmation.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-200">
                    <p className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle size={12} /> Confirm before running
                    </p>
                    <ul className="mt-1 list-disc pl-4">
                      {c.needs_confirmation.map((n, j) => (
                        <li key={j}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => setGenFor(c.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm font-medium text-ink-primary transition-colors hover:bg-brand/20 sm:w-auto"
                  >
                    <Sparkles size={14} /> Generate This Concept
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Gallery strategy={strategy} generations={generations} setGenerations={setGenerations} imagesReady={imagesReady} creditCost={creditCost} />

      {genFor !== null && strategy.concepts && (
        <Generator
          strategy={strategy}
          initialConceptId={genFor || strategy.concepts[0].id}
          imagesReady={imagesReady}
          creditCost={creditCost}
          onClose={() => setGenFor(null)}
          onCreated={(rows) => {
            setGenerations((g) => [...rows, ...g]);
            setGenFor(null);
            requestAnimationFrame(() => document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
          setGenerations={setGenerations}
        />
      )}

      {editConcept && <ConceptEditor strategy={strategy} concept={editConcept} onClose={() => setEditConcept(null)} onSaved={(s) => { onStrategy(s); setEditConcept(null); }} />}
    </div>
  );
}

function ConceptEditor({ strategy, concept, onClose, onSaved }: { strategy: Strategy; concept: Concept; onClose: () => void; onSaved: (s: Strategy) => void }) {
  const [v, setV] = useState({ name: concept.name, hook: concept.hook, message: concept.message, visual: concept.visual, emphasis: concept.emphasis, cta: concept.cta });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    const res = await fetch(`/api/strategy/${strategy.id}/concept`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conceptId: concept.id, fields: v }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Couldn't save.");
    onSaved(j.strategy);
  };
  return (
    <Sheet title={`Edit concept: ${concept.name}`} onClose={onClose}>
      <div className="space-y-3">
        {(Object.keys(v) as (keyof typeof v)[]).map((k) => (
          <label key={k} className="block">
            <span className="text-xs capitalize text-ink-muted">{k === "hook" ? "Hook / headline" : k}</span>
            <textarea rows={k === "visual" || k === "message" ? 3 : 1} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary focus:border-brand/50 focus:outline-none" />
          </label>
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-accent-red">{err}</p>}
      <button type="button" disabled={busy} onClick={save} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white">
        {busy && <Loader2 size={13} className="animate-spin" />} Save concept
      </button>
    </Sheet>
  );
}

export function Sheet({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="lib-backdrop absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div className={`cs-sheet relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-base-border bg-base-bg p-5 sm:rounded-2xl sm:p-6 ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-semibold text-ink-primary">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-secondary hover:bg-base-surface hover:text-ink-primary">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ id, icon, title, sub }: { id: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div>
      <h2 id={id} className="flex items-center gap-2 text-lg font-semibold text-ink-primary">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand-light">{icon}</span>
        {title}
      </h2>
      <p className="mt-1 text-sm text-ink-secondary">{sub}</p>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <dt className={`text-[11px] font-medium uppercase tracking-wide ${accent ? "text-brand-light" : "text-ink-muted"}`}>{k}</dt>
      <dd className={`mt-0.5 leading-relaxed ${accent ? "text-ink-primary" : "text-ink-secondary"}`}>{v}</dd>
    </div>
  );
}

function Panel({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm text-ink-secondary ${tone === "warn" ? "border-amber-400/30 bg-amber-400/5" : "border-base-border bg-base-card"}`}>
      <p className={`mb-2 text-[11px] font-medium uppercase tracking-wide ${tone === "warn" ? "text-amber-300" : "text-ink-muted"}`}>{title}</p>
      {children}
    </div>
  );
}
