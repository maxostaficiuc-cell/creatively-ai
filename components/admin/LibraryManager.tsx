"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, RefreshCcw, Trash2, X } from "lucide-react";
import { ANGLE_TEXT, LABEL_TEXT, type LibraryCreative } from "@/lib/library";

const API = "/api/admin/library";

type Draft = Record<string, string | boolean>;

const EMPTY: Draft = {
  slug: "", brand: "", title: "", industry: "", platform: "YouTube", format: "video", angles: "", summary: "",
  hook: "", visual_strategy: "", offer: "", messaging: "", cta: "", why_study: "", test_idea: "",
  preview_kind: "youtube", youtube_id: "", image_url: "", headline: "", source_url: "", source_label: "", attribution: "",
  year: "", label: "inspiration", evidence_url: "", evidence_note: "", sort_order: "500", is_published: true,
};

const toDraft = (c: LibraryCreative): Draft => {
  const d: Draft = { ...EMPTY };
  for (const k of Object.keys(EMPTY)) {
    const v = (c as unknown as Record<string, unknown>)[k];
    d[k] = k === "is_published" ? Boolean(v) : Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "" : String(v);
  }
  return d;
};

export function LibraryManager() {
  const [items, setItems] = useState<LibraryCreative[] | null>(null);
  const [seedCount, setSeedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load the library.");
      setItems(json.items);
      setSeedCount(json.seedCount ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the library.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (key: string, method: string, body: unknown) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(API, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      await load();
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!editing) return;
    const ok = editing.id ? await call("save", "PATCH", { id: editing.id, ...editing.draft }) : await call("save", "POST", editing.draft);
    if (ok) setEditing(null);
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing({ id: null, draft: { ...EMPTY } })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-light to-brand px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={14} /> Add entry
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            const r = await call("seed", "POST", { action: "restore-seed" });
            if (r) setError(r.added ? `Restored ${r.added} missing curated example${r.added === 1 ? "" : "s"}.` : "All curated examples are already present.");
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-base-border px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary"
        >
          {busy === "seed" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Restore missing curated examples ({seedCount})
        </button>
      </div>

      {error && <p className="rounded-xl border border-base-border bg-base-card p-3 text-sm text-ink-secondary">{error}</p>}

      {items === null ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-muted">No entries yet. Run supabase/seed-winning-ads.sql or use “Restore missing curated examples”.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-base-border bg-base-card">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Entry</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-base-border">
              {items.map((c) => (
                <tr key={c.id} className={c.is_published ? "" : "opacity-60"}>
                  <td className="px-4 py-3">
                    <p className="text-ink-primary">{c.brand} — {c.title}</p>
                    <p className="text-xs text-ink-muted">{c.platform} · {c.format} · {c.angles.map((a) => ANGLE_TEXT[a] ?? a).join(", ")}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{c.industry}</td>
                  <td className="px-4 py-3 text-ink-secondary">{LABEL_TEXT[c.label]}</td>
                  <td className="px-4 py-3 text-ink-secondary">{c.is_published ? "Published" : "Hidden"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn label="Edit" onClick={() => setEditing({ id: c.id, draft: toDraft(c) })}>
                        <Pencil size={14} />
                      </IconBtn>
                      <IconBtn label={c.is_published ? "Hide" : "Publish"} onClick={() => call(`pub-${c.id}`, "PATCH", { id: c.id, is_published: !c.is_published })}>
                        {c.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </IconBtn>
                      <IconBtn
                        label="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete “${c.title}”? This also removes it from everyone's saved list.`)) call(`del-${c.id}`, "DELETE", { id: c.id });
                        }}
                      >
                        <Trash2 size={14} />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-xl overflow-y-auto border-l border-base-border bg-base-bg p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink-primary">{editing.id ? "Edit entry" : "Add entry"}</h2>
              <IconBtn label="Close" onClick={() => setEditing(null)}>
                <X size={16} />
              </IconBtn>
            </div>
            <div className="mt-5 grid gap-3">
              <Field k="slug" hint="Unique id, e.g. brand-ad-name" e={editing} set={setEditing} />
              <Field k="brand" e={editing} set={setEditing} />
              <Field k="title" e={editing} set={setEditing} />
              <Field k="industry" hint="e.g. Beauty & Personal Care" e={editing} set={setEditing} />
              <Field k="platform" hint="Where the original lives: YouTube, Meta, TikTok, Print…" e={editing} set={setEditing} />
              <Select k="format" options={["video", "image", "carousel"]} e={editing} set={setEditing} />
              <Field k="angles" hint={`Comma separated: ${Object.keys(ANGLE_TEXT).join(", ")}`} e={editing} set={setEditing} />
              <Field k="summary" area e={editing} set={setEditing} />
              <Select k="preview_kind" options={["youtube", "image", "none"]} e={editing} set={setEditing} />
              <Field k="youtube_id" hint="11-character ID from the brand's own YouTube upload" e={editing} set={setEditing} />
              <Field k="image_url" hint="https:// image you have the right to show" e={editing} set={setEditing} />
              <Field k="headline" hint="Shown as text when there is no preview" e={editing} set={setEditing} />
              <Field k="source_url" hint="Original public source (https://)" e={editing} set={setEditing} />
              <Field k="source_label" e={editing} set={setEditing} />
              <Field k="attribution" e={editing} set={setEditing} />
              <Field k="year" e={editing} set={setEditing} />
              <Select k="label" options={["inspiration", "strong_structure", "verified_winner"]} e={editing} set={setEditing} />
              <Field k="evidence_url" hint="Required for Verified Winner" e={editing} set={setEditing} />
              <Field k="evidence_note" area hint="Quote the reported result and who reported it" e={editing} set={setEditing} />
              {(["hook", "visual_strategy", "offer", "messaging", "cta", "why_study", "test_idea"] as const).map((k) => (
                <Field key={k} k={k} area e={editing} set={setEditing} />
              ))}
              <Field k="sort_order" e={editing} set={setEditing} />
              <label className="flex items-center gap-2 text-sm text-ink-secondary">
                <input
                  type="checkbox"
                  checked={Boolean(editing.draft.is_published)}
                  onChange={(ev) => setEditing({ ...editing, draft: { ...editing.draft, is_published: ev.target.checked } })}
                />
                Published
              </label>
            </div>
            <button
              type="button"
              disabled={busy === "save"}
              onClick={save}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-light to-brand px-5 py-2.5 text-sm font-medium text-white"
            >
              {busy === "save" && <Loader2 size={14} className="animate-spin" />} Save
            </button>
            {error && <p className="mt-3 text-sm text-accent-red">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

type EditState = { id: string | null; draft: Draft };

function Field({ k, e, set, area, hint }: { k: string; e: EditState; set: (v: EditState) => void; area?: boolean; hint?: string }) {
  const cls = "w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary focus:border-brand/50 focus:outline-none";
  const value = String(e.draft[k] ?? "");
  const onChange = (v: string) => set({ ...e, draft: { ...e.draft, [k]: v } });
  return (
    <label className="block">
      <span className="text-xs text-ink-muted">{k.replace(/_/g, " ")}{hint ? ` — ${hint}` : ""}</span>
      {area ? (
        <textarea rows={3} value={value} onChange={(ev) => onChange(ev.target.value)} className={cls} />
      ) : (
        <input value={value} onChange={(ev) => onChange(ev.target.value)} className={cls} />
      )}
    </label>
  );
}

function Select({ k, options, e, set }: { k: string; options: string[]; e: EditState; set: (v: EditState) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-muted">{k.replace(/_/g, " ")}</span>
      <select
        value={String(e.draft[k])}
        onChange={(ev) => set({ ...e, draft: { ...e.draft, [k]: ev.target.value } })}
        className="w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="rounded-lg p-2 text-ink-secondary hover:bg-base-surface hover:text-ink-primary">
      {children}
    </button>
  );
}
