"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";
import { ANGLE_TEXT, LABEL_TEXT, MEDIA_CHECK_TEXT, type LibraryCreative } from "@/lib/library";

// Admin for the Winning Ads library — static image ads from Meta Ad Library only.
// Import: search Meta Ad Library (image ads only) → attach the ad image → save.
// Without an API token, "Add manually" requires the Ad Library link and a
// confirmation that the listing is a single static image.

const API = "/api/admin/library";

type MetaAd = {
  id: string;
  pageId: string | null;
  pageName: string | null;
  bodies: string[];
  titles: string[];
  start: string | null;
  stop: string | null;
  platforms: string[];
  active: boolean;
  adLibraryUrl: string;
};

type Draft = { mode: "meta_api" | "manual"; ad?: MetaAd; values: Record<string, string> };

const EDIT_FIELDS = ["brand", "title", "industry", "platform", "angles", "summary", "headline", "ad_copy", "cta_text", "hook", "visual_strategy", "offer", "messaging", "cta", "why_study", "test_idea", "label", "evidence_url", "evidence_note"] as const;
const AREA = new Set(["summary", "ad_copy", "hook", "visual_strategy", "offer", "messaging", "cta", "why_study", "test_idea", "evidence_note"]);
const HINT: Record<string, string> = {
  industry: "e.g. Beauty & Personal Care",
  angles: `comma separated: ${Object.keys(ANGLE_TEXT).join(", ")}`,
  ad_copy: "primary text, exactly as in the ad",
  headline: "headline under the image",
  cta_text: "button text, e.g. Shop now",
  summary: "one or two sentences: what makes it interesting",
  evidence_url: "only for Verified Winner",
  evidence_note: "quote the reported result + who reported it",
};

export function LibraryManager() {
  const [items, setItems] = useState<LibraryCreative[] | null>(null);
  const [metaConfigured, setMetaConfigured] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<{ id: string; values: Record<string, string> } | null>(null);
  const [search, setSearch] = useState({ q: "", country: "EU", active: true });
  const [results, setResults] = useState<MetaAd[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load the library.");
      setItems(json.items);
      setMetaConfigured(!!json.metaConfigured);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not load the library.");
      setItems([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const industries = useMemo(() => Array.from(new Set((items ?? []).map((i) => i.industry))).sort(), [items]);
  const existingIds = useMemo(() => new Set((items ?? []).map((i) => i.ad_library_id)), [items]);

  const json = async (key: string, method: string, body: unknown) => {
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch(API, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong.");
      await load();
      return j;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const runSearch = async () => {
    setBusy("search");
    setMsg(null);
    try {
      const p = new URLSearchParams({ country: search.country, active: search.active ? "1" : "0" });
      if (/^\d+(,\d+)*$/.test(search.q.trim())) p.set("pages", search.q.trim());
      else p.set("q", search.q.trim());
      const res = await fetch(`${API}/meta-search?${p}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Search failed.");
      setResults(j.ads);
      if (!j.ads.length) setMsg("No image ads found for that search in the selected countries.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Import */}
      <section className="rounded-2xl border border-base-border bg-base-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-ink-primary">Import from Meta Ad Library</h2>
            <p className="mt-1 text-xs text-ink-muted">Static image ads only. Videos, Reels and carousels are never accepted.</p>
          </div>
          <button
            type="button"
            onClick={() => setDraft({ mode: "manual", values: { label: "inspiration", platform: "Meta" } })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-border px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary"
          >
            <Plus size={14} /> Add manually
          </button>
        </div>

        {metaConfigured ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={search.q}
              onChange={(e) => setSearch({ ...search, q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Brand or keyword — or Facebook page ID(s)"
              className="h-10 flex-1 rounded-xl border border-base-border bg-base-surface px-3 text-sm text-ink-primary"
            />
            <select value={search.country} onChange={(e) => setSearch({ ...search, country: e.target.value })} className="h-10 rounded-xl border border-base-border bg-base-surface px-3 text-sm text-ink-primary">
              <option value="EU">All EU countries</option>
              {["DE", "FR", "IT", "ES", "NL", "PL", "SE", "IE", "RO", "BE"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-1 text-xs text-ink-secondary">
              <input type="checkbox" checked={search.active} onChange={(e) => setSearch({ ...search, active: e.target.checked })} /> Active only
            </label>
            <button type="button" onClick={runSearch} disabled={busy === "search"} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm text-white">
              {busy === "search" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search image ads
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-base-border bg-base-surface p-3 text-xs leading-relaxed text-ink-secondary">
            Meta Ad Library search is off: add a <code className="text-brand-light">META_AD_LIBRARY_ACCESS_TOKEN</code> in Netlify to search image ads and
            have Meta confirm each one is an image ad. Until then, use “Add manually” with the ad&apos;s Ad Library link.
          </p>
        )}

        {results && results.length > 0 && (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {results.map((a) => (
              <li key={a.id} className="rounded-xl border border-base-border bg-base-surface p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink-primary">{a.pageName ?? "Unknown page"}</p>
                  <span className={a.active ? "text-accent-green" : "text-ink-muted"}>{a.active ? "Active" : "Inactive"}</span>
                </div>
                <p className="mt-1 line-clamp-3 text-ink-secondary">{a.bodies[0] ?? a.titles[0] ?? "(no text)"}</p>
                <p className="mt-1 text-ink-muted">
                  ID {a.id} · since {a.start?.slice(0, 10) ?? "?"} · {a.platforms.join(", ")}
                  {a.bodies.length > 1 || a.titles.length > 1 ? " · has multiple versions" : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  <a href={a.adLibraryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-light hover:underline">
                    Open in Ad Library <ExternalLink size={11} />
                  </a>
                  {existingIds.has(a.id) ? (
                    <span className="text-ink-muted">Already in library</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          mode: "meta_api",
                          ad: a,
                          values: { brand: a.pageName ?? "", title: a.titles[0] ?? "", headline: a.titles[0] ?? "", ad_copy: a.bodies[0] ?? "", label: "inspiration" },
                        })
                      }
                      className="text-ink-primary hover:underline"
                    >
                      Import →
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {msg && <p className="rounded-xl border border-base-border bg-base-card p-3 text-sm text-ink-secondary">{msg}</p>}

      {/* Entries */}
      {items === null ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-muted">No image ads yet. Import the first one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-base-border bg-base-card">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Check</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-base-border">
              {items.map((c) => (
                <tr key={c.id} className={c.is_published ? "" : "opacity-60"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.image_url && <img src={c.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                      <div>
                        <p className="text-ink-primary">{c.brand} — {c.title}</p>
                        <p className="text-xs text-ink-muted">{c.industry} · {LABEL_TEXT[c.label]} · ID {c.ad_library_id ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-secondary">{c.media_check ? MEDIA_CHECK_TEXT[c.media_check] : "—"}</td>
                  <td className="px-4 py-3 text-ink-secondary">{c.is_published ? "Published" : "Hidden"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn label="Edit" onClick={() => setEditing({ id: c.id, values: Object.fromEntries(EDIT_FIELDS.map((k) => [k, k === "angles" ? c.angles.join(", ") : String((c as unknown as Record<string, unknown>)[k] ?? "")])) })}>
                        <Pencil size={14} />
                      </IconBtn>
                      {c.media_check === "meta_api_image_filter" && (
                        <IconBtn label="Re-check with Meta" onClick={async () => { const r = await json(`re-${c.id}`, "POST", { action: "recheck", id: c.id }); if (r) setMsg(r.confirmed ? "Still confirmed as an image ad." : `Hidden: ${r.reason}`); }}>
                          {busy === `re-${c.id}` ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                        </IconBtn>
                      )}
                      <IconBtn label={c.is_published ? "Hide" : "Publish"} onClick={() => json(`pub-${c.id}`, "PATCH", { id: c.id, is_published: !c.is_published })}>
                        {c.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </IconBtn>
                      <IconBtn label="Delete" onClick={() => window.confirm(`Delete “${c.title}”? This also removes its image and everyone's saves of it.`) && json(`del-${c.id}`, "DELETE", { id: c.id })}>
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

      {draft && <ImportPanel draft={draft} industries={industries} onClose={() => setDraft(null)} onDone={async (m) => { setDraft(null); setMsg(m); setResults((r) => r); await load(); }} />}

      {editing && (
        <Panel title="Edit entry" onClose={() => setEditing(null)}>
          <Fields values={editing.values} set={(values) => setEditing({ ...editing, values })} industries={industries} />
          <button
            type="button"
            disabled={busy === "save"}
            onClick={async () => {
              const r = await json("save", "PATCH", { id: editing.id, ...editing.values });
              if (r) setEditing(null);
            }}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm text-white"
          >
            {busy === "save" && <Loader2 size={14} className="animate-spin" />} Save
          </button>
          {msg && <p className="mt-3 text-sm text-accent-red">{msg}</p>}
        </Panel>
      )}
    </div>
  );
}

function ImportPanel({ draft, industries, onClose, onDone }: { draft: Draft; industries: string[]; onClose: () => void; onDone: (msg: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>(draft.values);
  const [adRef, setAdRef] = useState(draft.ad?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const submit = async () => {
    setErr(null);
    if (!file) return setErr("Attach the ad image (PNG, JPG or WebP).");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", draft.mode);
    fd.append("ad_library_id", adRef);
    if (draft.ad?.pageId) fd.append("page_id", draft.ad.pageId);
    for (const [k, v] of Object.entries(values)) fd.append(k, v);
    if (confirm) fd.append("confirm_static", "yes");
    if (publish) fd.append("publish", "yes");
    setBusy(true);
    const res = await fetch(`${API}/import`, { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Import failed.");
    onDone(`Imported ${j.item.brand} — ${j.item.title}${j.item.is_published ? " (published)" : " (hidden)"}.`);
  };

  return (
    <Panel title={draft.mode === "meta_api" ? "Import image ad (verified with Meta)" : "Add image ad manually"} onClose={onClose}>
      <div className="grid gap-3">
        <label className="block">
          <span className="text-xs text-ink-muted">Meta Ad Library ID or link</span>
          <input
            value={adRef}
            onChange={(e) => setAdRef(e.target.value)}
            disabled={draft.mode === "meta_api"}
            placeholder="https://www.facebook.com/ads/library/?id=…"
            className="w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-muted">Ad image — the complete static creative, saved from its Ad Library listing (PNG, JPG or WebP)</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-ink-secondary" />
        </label>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="Selected ad image" className="max-h-72 w-auto self-start rounded-lg border border-base-border" />}
        <Fields values={values} set={setValues} industries={industries} />
        {draft.mode === "manual" && (
          <label className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/5 p-3 text-xs text-ink-secondary">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5" />
            I opened this ad in Meta Ad Library and confirmed it is a single static image ad — not a video, Reel or carousel — and the image above is that ad.
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-ink-secondary">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish to Winning Ads
        </label>
      </div>
      <button type="button" disabled={busy} onClick={submit} className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm text-white">
        {busy && <Loader2 size={14} className="animate-spin" />} {draft.mode === "meta_api" ? "Verify with Meta & import" : "Import"}
      </button>
      {err && <p className="mt-3 text-sm text-accent-red">{err}</p>}
    </Panel>
  );
}

function Fields({ values, set, industries }: { values: Record<string, string>; set: (v: Record<string, string>) => void; industries: string[] }) {
  const cls = "w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink-primary focus:border-brand/50 focus:outline-none";
  return (
    <>
      <datalist id="lib-industries">
        {industries.map((i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
      {EDIT_FIELDS.map((k) =>
        k === "label" ? (
          <label key={k} className="block">
            <span className="text-xs text-ink-muted">label</span>
            <select value={values.label ?? "inspiration"} onChange={(e) => set({ ...values, label: e.target.value })} className={cls}>
              <option value="inspiration">Creative Inspiration</option>
              <option value="strong_structure">Strong Creative Structure</option>
              <option value="verified_winner">Verified Winner (needs evidence)</option>
            </select>
          </label>
        ) : (
          <label key={k} className="block">
            <span className="text-xs text-ink-muted">
              {k.replace(/_/g, " ")}
              {HINT[k] ? ` — ${HINT[k]}` : ""}
            </span>
            {AREA.has(k) ? (
              <textarea rows={3} value={values[k] ?? ""} onChange={(e) => set({ ...values, [k]: e.target.value })} className={cls} />
            ) : (
              <input list={k === "industry" ? "lib-industries" : undefined} value={values[k] ?? ""} onChange={(e) => set({ ...values, [k]: e.target.value })} className={cls} />
            )}
          </label>
        )
      )}
    </>
  );
}

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-base-border bg-base-bg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-medium text-ink-primary">{title}</h2>
          <IconBtn label="Close" onClick={onClose}>
            <X size={16} />
          </IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="rounded-lg p-2 text-ink-secondary hover:bg-base-surface hover:text-ink-primary">
      {children}
    </button>
  );
}
