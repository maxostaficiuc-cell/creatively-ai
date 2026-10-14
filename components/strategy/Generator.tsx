"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Copy, Download, Expand, FolderPlus, Loader2, Pencil, Plus, RefreshCcw, ScanSearch, Sparkles, X } from "lucide-react";
import { useCredits } from "@/components/dashboard/CreditsContext";
import { Sheet } from "@/components/strategy/StrategyResults";
import { ASPECT_RATIOS, PLATFORMS, STYLES, TEXT_DENSITY, VARIATION_COUNTS, type GenerationOptions, type Generation, type Strategy } from "@/lib/strategyTypes";
import { CREDIT_COST_IMAGE } from "@/lib/types";

type SetGens = React.Dispatch<React.SetStateAction<Generation[]>>;
type Credits = ReturnType<typeof useCredits>;

/** Runs generations on the server (max 2 at a time). Each image is charged only when delivered. */
async function runGenerations(ids: string[], setGenerations: SetGens, credits: Credits) {
  const queue = [...ids];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      setGenerations((gs) => gs.map((g) => (g.id === id ? { ...g, status: "generating", error: null } : g)));
      let data: Record<string, unknown> = {};
      let ok = false;
      try {
        const res = await fetch(`/api/strategy/generations/${id}/run`, { method: "POST" });
        data = await res.json().catch(() => ({}));
        ok = res.ok;
        if (res.status === 409) continue; // already running elsewhere — the poller picks it up
      } catch {
        data = { error: "Connection lost. The image may still finish — refresh to check." };
      }
      if (ok && data.generation) {
        const g = data.generation as Generation;
        setGenerations((gs) => gs.map((x) => (x.id === id ? g : x)));
        if (typeof data.remainingCredits === "number" && Number(data.charged) > 0) credits?.confirmCharge(`gen:${id}`, Number(data.charged), data.remainingCredits);
      } else {
        setGenerations((gs) => gs.map((x) => (x.id === id ? { ...x, status: "failed", error: String(data.error ?? "Generation failed.") } : x)));
      }
    }
  };
  await Promise.all([worker(), worker()]);
}

export function Generator({
  strategy,
  initialConceptId,
  imagesReady,
  creditCost,
  onClose,
  onCreated,
  setGenerations,
}: {
  strategy: Strategy;
  initialConceptId: string;
  imagesReady: boolean;
  creditCost: number;
  onClose: () => void;
  onCreated: (rows: Generation[]) => void;
  setGenerations: SetGens;
}) {
  const credits = useCredits();
  const balance = credits?.balance ?? 0;
  const [conceptId, setConceptId] = useState(initialConceptId);
  const [count, setCount] = useState<number>(3);
  const [opts, setOpts] = useState<GenerationOptions>({ aspect_ratio: "4:5", style: "clean_product", text_density: "balanced", brand_consistency: true, platform: "meta" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const total = count * creditCost;
  const short = total > balance;
  const concept = strategy.concepts!.find((c) => c.id === conceptId)!;

  const start = async () => {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/strategy/${strategy.id}/batch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conceptId, count, options: opts }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Couldn't start generation.");
    const rows = j.generations as Generation[];
    onCreated(rows);
    runGenerations(rows.map((r) => r.id), setGenerations, credits);
  };

  return (
    <Sheet title="Generate ads" onClose={onClose} wide>
      {!imagesReady ? (
        <div className="rounded-xl border border-base-border bg-base-card p-4 text-sm text-ink-secondary">
          <p className="font-medium text-ink-primary">Image generation isn&apos;t set up yet</p>
          <p className="mt-1">The server needs a Google Gemini API key (GEMINI_API_KEY) before ads can be generated. Your strategy and concepts are saved and ready.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <Field label="Concept">
            <select value={conceptId} onChange={(e) => setConceptId(e.target.value)} className="h-11 w-full rounded-xl border border-base-border bg-base-surface px-3 text-sm text-ink-primary">
              {strategy.concepts!.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.angle}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-muted">“{concept.hook}” · {concept.cta}</p>
          </Field>
          <Field label="Variations">
            <Seg value={String(count)} onChange={(v) => setCount(Number(v))} options={VARIATION_COUNTS.map((n) => ({ id: String(n), label: `${n}` }))} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Format">
              <Seg value={opts.aspect_ratio} onChange={(v) => setOpts({ ...opts, aspect_ratio: v as GenerationOptions["aspect_ratio"] })} options={ASPECT_RATIOS.map((a) => ({ id: a.id, label: a.id, title: `${a.label} — ${a.hint}` }))} />
            </Field>
            <Field label="Platform">
              <select value={opts.platform} onChange={(e) => setOpts({ ...opts, platform: e.target.value as GenerationOptions["platform"] })} className="h-10 w-full rounded-xl border border-base-border bg-base-surface px-3 text-sm text-ink-primary">
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Creative style">
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s.id} on={opts.style === s.id} onClick={() => setOpts({ ...opts, style: s.id })}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Text on the image">
              <Seg value={opts.text_density} onChange={(v) => setOpts({ ...opts, text_density: v as GenerationOptions["text_density"] })} options={TEXT_DENSITY.map((d) => ({ id: d.id, label: d.label }))} />
            </Field>
            <Field label="Brand consistency">
              <label className="flex h-10 items-center gap-2 text-sm text-ink-secondary">
                <input type="checkbox" checked={opts.brand_consistency} onChange={(e) => setOpts({ ...opts, brand_consistency: e.target.checked })} />
                Keep brand colors{strategy.brand_profile?.reference_images?.length ? " and product look" : ""}
              </label>
            </Field>
          </div>

          <div className="sticky -bottom-5 -mx-5 -mb-5 border-t border-base-border bg-base-bg/95 p-5 backdrop-blur sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="text-ink-primary">
                  {count} × {creditCost} = <span className="font-semibold tabular-nums">{total.toLocaleString()} credits</span>
                </p>
                <p className={`text-xs ${short ? "text-accent-red" : "text-ink-muted"}`}>
                  {short ? `You have ${balance.toLocaleString()} credits — not enough for this.` : `Balance ${balance.toLocaleString()} · charged per image, only when it's delivered`}
                </p>
              </div>
              <button type="button" disabled={busy || short} onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Writing the copy…" : `Generate ${count} ad${count === 1 ? "" : "s"}`}
              </button>
            </div>
            {err && <p className="mt-2 text-sm text-accent-red">{err}</p>}
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ── gallery ─────────────────────────────────────────────────────────────── */

export function Gallery({ strategy, generations, setGenerations, imagesReady, creditCost }: { strategy: Strategy; generations: Generation[]; setGenerations: SetGens; imagesReady: boolean; creditCost: number }) {
  const credits = useCredits();
  const [full, setFull] = useState<Generation | null>(null);
  const batches = useMemo(() => {
    const m = new Map<string, Generation[]>();
    for (const g of generations) m.set(g.batch_id, [...(m.get(g.batch_id) ?? []), g]);
    return Array.from(m.values()).map((rows) => rows.sort((a, b) => a.variation - b.variation));
  }, [generations]);

  // Images still generating on the server (e.g. after a reload) are polled until they finish.
  const generating = generations.some((g) => g.status === "generating");
  const startedHere = useRef(new Set<string>());
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/strategy/${strategy.id}`).catch(() => null);
      if (!res?.ok) return;
      const j = await res.json();
      setGenerations((gs) => gs.map((g) => (g.status === "generating" ? (j.generations as Generation[]).find((x) => x.id === g.id && x.status !== "generating") ?? g : g)));
    }, 5000);
    return () => clearInterval(t);
  }, [generating, strategy.id, setGenerations]);

  const run = useCallback((ids: string[]) => {
    ids.forEach((i) => startedHere.current.add(i));
    runGenerations(ids, setGenerations, credits);
  }, [setGenerations, credits]);

  const add = async (url: string, body?: unknown) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error ?? "Something went wrong.");
    const rows: Generation[] = j.generations ?? [j.generation];
    setGenerations((gs) => [...rows, ...gs]);
    run(rows.map((r) => r.id));
  };

  if (generations.length === 0) return null;
  return (
    <section id="gallery" aria-labelledby="gal" className="cs-reveal scroll-mt-6">
      <h2 id="gal" className="text-lg font-semibold text-ink-primary">Generated creatives</h2>
      <p className="mt-1 text-sm text-ink-secondary">New ads to test — not proven winners. Each image costs {creditCost} credits, charged only when it&apos;s delivered.</p>
      <div className="mt-5 space-y-8">
        {batches.map((rows) => {
          const c = strategy.concepts?.find((x) => x.id === rows[0].concept_id);
          const o = rows[0].options;
          const done = rows.filter((r) => r.status === "completed").length;
          return (
            <div key={rows[0].batch_id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink-primary">
                  {c?.name ?? "Concept"} <span className="text-ink-muted">· {o.aspect_ratio} · {STYLES.find((s) => s.id === o.style)?.label} · {TEXT_DENSITY.find((d) => d.id === o.text_density)?.label} text</span>
                </p>
                <p className="text-xs text-ink-muted">
                  {done} of {rows.length} ready
                </p>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((g, i) => (
                  <GenCard
                    key={g.id}
                    g={g}
                    index={i}
                    conceptName={c?.name ?? ""}
                    imagesReady={imagesReady}
                    creditCost={creditCost}
                    onFull={() => setFull(g)}
                    onRun={() => run([g.id])}
                    onRegenerate={() => add(`/api/strategy/generations/${g.id}/regenerate`)}
                    onAnother={() => add(`/api/strategy/${strategy.id}/batch`, { conceptId: g.concept_id, count: 1, options: g.options })}
                    onUpdate={(ng) => setGenerations((gs) => gs.map((x) => (x.id === ng.id ? ng : x)))}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {full && full.image_url && (
        <Sheet title={full.spec.headline} onClose={() => setFull(null)} wide>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={full.image_url} alt={`Generated ad: ${full.spec.headline}`} className="mx-auto max-h-[75vh] w-auto rounded-xl" />
          <p className="mt-3 text-sm text-ink-secondary">{full.spec.primary_text}</p>
        </Sheet>
      )}
    </section>
  );
}

function GenCard({
  g,
  index,
  conceptName,
  imagesReady,
  creditCost,
  onFull,
  onRun,
  onRegenerate,
  onAnother,
  onUpdate,
}: {
  g: Generation;
  index: number;
  conceptName: string;
  imagesReady: boolean;
  creditCost: number;
  onFull: () => void;
  onRun: () => void;
  onRegenerate: () => Promise<void>;
  onAnother: () => Promise<void>;
  onUpdate: (g: Generation) => void;
}) {
  const router = useRouter();
  const credits = useCredits();
  const [editing, setEditing] = useState(false);
  const [copy, setCopy] = useState(g.spec);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(g.saved_creative_id);
  const ratio = g.options.aspect_ratio.replace(":", " / ");

  useEffect(() => setCopy(g.spec), [g.spec]);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const saveCopy = () =>
    act("copy", async () => {
      const res = await fetch(`/api/strategy/generations/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(copy) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Couldn't save.");
      onUpdate(j.generation);
      setEditing(false);
    });

  const save = () =>
    act("save", async () => {
      const res = await fetch(`/api/strategy/generations/${g.id}/save`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Couldn't save.");
      setSavedId(j.creativeId);
    });

  const analyze = () =>
    act("analyze", async () => {
      if (!g.image_url) return;
      if (!window.confirm(`Analyze this ad with the regular Creative Analysis? It costs ${CREDIT_COST_IMAGE} credits.`)) return;
      const blob = await (await fetch(g.image_url)).blob();
      const form = new FormData();
      form.append("file", new File([blob], `generated-${g.id}.${blob.type.split("/")[1] ?? "png"}`, { type: blob.type }));
      form.append("requestId", `an-${g.id}`);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.creative) throw new Error(j.error ?? "Analysis failed.");
      if (typeof j.remainingCredits === "number") credits?.confirmCharge(j.transactionId ?? `an-${g.id}`, Number(j.charged ?? 0), j.remainingCredits);
      router.push(`/my-creatives/${j.creative.id}`);
    });

  return (
    <article className="cs-item overflow-hidden rounded-2xl border border-base-border bg-base-card" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="relative w-full overflow-hidden bg-base-surface" style={{ aspectRatio: ratio, maxHeight: 520 }}>
        {g.status === "completed" && g.image_url ? (
          <button type="button" onClick={onFull} className="group block h-full w-full" aria-label="View full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.image_url} alt={`Generated ad: ${g.spec.headline}`} className="cs-img h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            <span className="absolute right-2 top-2 rounded-lg bg-black/55 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              <Expand size={14} />
            </span>
          </button>
        ) : g.status === "generating" ? (
          <div className="cs-shimmer flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-ink-secondary" aria-busy="true">
            <Loader2 size={18} className="animate-spin text-brand-light" /> Generating image…
          </div>
        ) : g.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center text-xs text-ink-secondary">
            <AlertCircle size={18} className="text-accent-red" />
            <span>{g.error ?? "Generation failed."}</span>
            {imagesReady && (
              <button type="button" onClick={onRun} className="mt-1 rounded-lg border border-base-border px-3 py-1.5 text-ink-primary hover:border-brand/40">
                Try again
              </button>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center text-xs text-ink-secondary">
            Not generated yet
            {imagesReady && (
              <button type="button" onClick={onRun} className="rounded-lg bg-brand px-3 py-1.5 font-medium text-white">
                Generate · {creditCost} credits
              </button>
            )}
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur ${g.status === "completed" ? "bg-black/55 text-white" : g.status === "failed" ? "bg-accent-red/80 text-white" : "bg-black/55 text-ink-secondary"}`}>
          {g.status === "completed" ? `Ready · ${g.options.aspect_ratio}` : g.status === "generating" ? "Generating" : g.status === "failed" ? "Failed" : "Pending"}
        </span>
      </div>

      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-ink-muted">
          {conceptName} · v{g.variation}
        </p>
        {editing ? (
          <div className="mt-2 space-y-2">
            {(["headline", "primary_text", "cta"] as const).map((k) => (
              <textarea key={k} rows={k === "primary_text" ? 3 : 1} value={copy[k]} onChange={(e) => setCopy({ ...copy, [k]: e.target.value })} aria-label={k.replace("_", " ")} className="w-full rounded-lg border border-base-border bg-base-surface px-2.5 py-2 text-sm text-ink-primary" />
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={saveCopy} disabled={busy === "copy"} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white">
                Save copy
              </button>
              <button type="button" onClick={() => { setCopy(g.spec); setEditing(false); }} className="rounded-lg border border-base-border px-3 py-1.5 text-xs text-ink-secondary">
                Cancel
              </button>
            </div>
            {g.status === "completed" && <p className="text-[11px] text-ink-muted">This changes the copy only. Use Regenerate for a new image with the new headline.</p>}
          </div>
        ) : (
          <>
            <h3 className="mt-1 font-medium leading-snug text-ink-primary">{g.spec.headline}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{g.spec.primary_text}</p>
            <p className="mt-2 inline-flex rounded-md border border-base-border px-2 py-0.5 text-xs text-ink-primary">{g.spec.cta}</p>
          </>
        )}

        {!editing && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Act label="Edit copy" onClick={() => setEditing(true)} icon={<Pencil size={13} />} />
            <Act label="Copy text" onClick={() => navigator.clipboard?.writeText(`${g.spec.headline}\n\n${g.spec.primary_text}\n\nCTA: ${g.spec.cta}`).then(() => setMsg("Copied."))} icon={<Copy size={13} />} />
            {g.status === "completed" && (
              <>
                <a href={`/api/strategy/generations/${g.id}/download`} className="inline-flex items-center gap-1 rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary">
                  <Download size={13} /> Download
                </a>
                {savedId ? (
                  <a href={`/my-creatives/${savedId}`} className="inline-flex items-center gap-1 rounded-lg border border-accent-green/30 px-2.5 py-1.5 text-xs text-accent-green">
                    <Check size={13} /> Saved · open
                  </a>
                ) : (
                  <Act label="Save to My Creatives" onClick={save} busy={busy === "save"} icon={<FolderPlus size={13} />} />
                )}
                {imagesReady && <Act label={`Regenerate · ${creditCost}`} onClick={() => act("regen", onRegenerate)} busy={busy === "regen"} icon={<RefreshCcw size={13} />} />}
                {imagesReady && <Act label={`Another variation · ${creditCost}`} onClick={() => act("another", onAnother)} busy={busy === "another"} icon={<Plus size={13} />} />}
                <Act label={`Analyze · ${CREDIT_COST_IMAGE}`} onClick={analyze} busy={busy === "analyze"} icon={<ScanSearch size={13} />} />
              </>
            )}
          </div>
        )}
        {msg && <p className="mt-2 text-xs text-ink-muted">{msg}</p>}
      </div>
    </article>
  );
}

function Act({ label, onClick, icon, busy }: { label: string; onClick: () => void; icon: React.ReactNode; busy?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-ink-secondary transition-colors hover:border-brand/40 hover:text-ink-primary disabled:opacity-50">
      {busy ? <Loader2 size={13} className="animate-spin" /> : icon} {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string; title?: string }[] }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1 rounded-xl border border-base-border bg-base-surface p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          title={o.title}
          onClick={() => onChange(o.id)}
          className={`min-w-[3rem] flex-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${value === o.id ? "bg-brand text-white" : "text-ink-secondary hover:text-ink-primary"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-xl border px-3 py-2 text-sm transition-colors ${on ? "border-brand bg-brand/15 text-ink-primary" : "border-base-border text-ink-secondary hover:text-ink-primary"}`}>
      {children}
    </button>
  );
}

