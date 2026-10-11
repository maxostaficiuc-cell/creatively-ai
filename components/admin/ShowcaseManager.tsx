"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { SHOWCASE_MAX_ITEMS, type ShowcaseCreative } from "@/lib/showcase";

const API = "/api/admin/showcase";

/** Read the natural pixel size of an image file in the browser. */
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image."));
    };
    img.src = url;
  });
}

export function ShowcaseManager() {
  const [items, setItems] = useState<ShowcaseCreative[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // which action is running
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load the showcase.");
      setItems(json.items);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Could not load the showcase.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(files: FileList, replaceId?: string) {
    setError(null);
    setBusy(replaceId ? `replace-${replaceId}` : "upload");
    try {
      for (const file of Array.from(files)) {
        const { width, height } = await readDimensions(file);
        const form = new FormData();
        form.set("file", file);
        form.set("width", String(width));
        form.set("height", String(height));
        if (replaceId) form.set("replaceId", replaceId);
        const res = await fetch(API, { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function patch(body: Record<string, unknown>, busyKey: string) {
    setError(null);
    setBusy(busyKey);
    try {
      const res = await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this creative from the showcase? The image will be deleted.")) return;
    setError(null);
    setBusy(`del-${id}`);
    try {
      const res = await fetch(API, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  function move(index: number, dir: -1 | 1) {
    if (!items) return;
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    patch({ order: next.map((i) => i.id) }, "order");
  }

  if (items === null) {
    return (
      <div className="mt-10 flex items-center gap-2 text-sm text-ink-muted">
        <Loader2 size={15} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mt-8">
      {error && (
        <p className="mb-4 rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-2.5 text-sm text-accent-red">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {items.length}/{SHOWCASE_MAX_ITEMS} creatives
          {items.length === 0 && " — the homepage shows the demo gallery until you upload."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs text-ink-secondary hover:text-ink-primary"
          >
            <RefreshCcw size={13} /> Refresh
          </button>
          <button
            type="button"
            disabled={busy !== null || items.length >= SHOWCASE_MAX_ITEMS}
            onClick={() => addInput.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy === "upload" ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            Upload images
          </button>
        </div>
      </div>
      <input
        ref={addInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          if (e.target.files?.length && replaceTarget.current) uploadFiles(e.target.files, replaceTarget.current);
          e.target.value = "";
        }}
      />

      <ul className="mt-6 space-y-3">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-4 rounded-xl border border-base-border bg-base-card p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt="" className="h-20 w-16 shrink-0 rounded-lg bg-black object-contain" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  defaultValue={item.title ?? ""}
                  placeholder="Title (optional)"
                  className="w-36 rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-ink-primary placeholder:text-ink-muted"
                  onBlur={(e) => e.target.value !== (item.title ?? "") && patch({ id: item.id, title: e.target.value }, `t-${item.id}`)}
                />
                <input
                  type="text"
                  defaultValue={item.category ?? ""}
                  placeholder="Category (optional)"
                  className="w-32 rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-ink-primary placeholder:text-ink-muted"
                  onBlur={(e) => e.target.value !== (item.category ?? "") && patch({ id: item.id, category: e.target.value }, `c-${item.id}`)}
                />
                <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                  Score
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={item.score}
                    className="w-16 rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-ink-primary"
                    onBlur={(e) => Number(e.target.value) !== item.score && patch({ id: item.id, score: Number(e.target.value) }, `s-${item.id}`)}
                  />
                  /100
                </label>
              </div>
              <p className="text-[11px] text-ink-muted">
                {item.width}×{item.height} · position {i + 1}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || busy !== null} aria-label="Move up" className="rounded-md p-1.5 text-ink-muted hover:text-ink-primary disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1 || busy !== null} aria-label="Move down" className="rounded-md p-1.5 text-ink-muted hover:text-ink-primary disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  replaceTarget.current = item.id;
                  replaceInput.current?.click();
                }}
                className="rounded-md px-2 py-1.5 text-[11px] text-ink-secondary hover:text-ink-primary disabled:opacity-30"
              >
                {busy === `replace-${item.id}` ? <Loader2 size={13} className="animate-spin" /> : "Replace"}
              </button>
              <button type="button" onClick={() => remove(item.id)} disabled={busy !== null} aria-label="Remove" className="rounded-md p-1.5 text-accent-red/80 hover:text-accent-red disabled:opacity-30">
                {busy === `del-${item.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
