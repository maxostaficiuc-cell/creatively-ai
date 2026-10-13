"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  BadgeCheck,
  ExternalLink,
  Lightbulb,
  Play,
  Search,
  X,
  RotateCw,
  Quote,
} from "lucide-react";
import {
  FORMAT_TEXT,
  LABEL_HELP,
  LABEL_TEXT,
  SORTS,
  angleText,
  youtubeEmbed,
  youtubeThumb,
  type LibraryCreative,
} from "@/lib/library";
import type { LibraryFilters, LibraryResult } from "@/lib/libraryServer";

type FilterKey = "industry" | "platform" | "format" | "angle";

export function LibraryBrowser({ result, filters }: { result: LibraryResult; filters: LibraryFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const [saved, setSaved] = useState<Set<string>>(new Set(result.status === "ok" ? result.savedIds : []));
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (result.status === "ok") setSaved(new Set(result.savedIds));
  }, [result]);

  // Deep link: /winning-ads?item=<slug> opens that creative.
  useEffect(() => {
    const item = new URLSearchParams(window.location.search).get("item");
    if (item) setOpenSlug(item);
  }, []);

  const push = useCallback(
    (patch: Partial<Record<keyof LibraryFilters, string>>) => {
      const p = new URLSearchParams(window.location.search);
      p.delete("item");
      for (const [k, v] of Object.entries(patch)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      if (p.get("sort") === "recent") p.delete("sort");
      const qs = p.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router]
  );

  // Debounced search → server query.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => push({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const open = (slug: string | null) => {
    setOpenSlug(slug);
    const p = new URLSearchParams(window.location.search);
    if (slug) p.set("item", slug);
    else p.delete("item");
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  const toggleSave = async (item: LibraryCreative) => {
    const was = saved.has(item.id);
    const next = new Set(saved);
    if (was) next.delete(item.id);
    else next.add(item.id);
    setSaved(next);
    try {
      const res = await fetch("/api/library/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creativeId: item.id, saved: !was }),
      });
      if (!res.ok) throw new Error(String(res.status));
      if (filters.saved && was) startTransition(() => router.refresh());
    } catch {
      setSaved((s) => {
        const r = new Set(s);
        if (was) r.add(item.id);
        else r.delete(item.id);
        return r;
      });
      setNotice("Couldn't update your saved list. Please try again.");
      setTimeout(() => setNotice(null), 3500);
    }
  };

  if (result.status === "not_set_up") {
    return (
      <StateCard
        title="The Winning Ads library is being set up"
        body="Curated examples will appear here as soon as the library is published. Nothing you do here uses credits."
      />
    );
  }
  if (result.status === "error") {
    return (
      <StateCard
        title="The library couldn't be loaded"
        body="This was a problem reading the library, not your account. Please try again."
        action={
          <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-base-border px-3 py-1.5 text-sm text-ink-secondary hover:border-brand/40 hover:text-ink-primary"
          >
            <RotateCw size={13} className={pending ? "animate-spin" : ""} /> Try again
          </button>
        }
      />
    );
  }

  const { items, facets, total } = result;
  const active = items.find((i) => i.slug === openSlug) ?? null;
  const hasFilters = !!(filters.q || filters.industry || filters.platform || filters.format || filters.angle || filters.saved);

  const selects: { key: FilterKey; label: string; options: { value: string; label: string }[] }[] = [
    { key: "industry", label: "Industry", options: facets.industries.map((v) => ({ value: v, label: v })) },
    { key: "platform", label: "Platform", options: facets.platforms.map((v) => ({ value: v, label: v })) },
    { key: "format", label: "Format", options: facets.formats.map((v) => ({ value: v, label: FORMAT_TEXT[v as keyof typeof FORMAT_TEXT] ?? v })) },
    { key: "angle", label: "Creative angle", options: facets.angles.map((v) => ({ value: v, label: angleText(v) })) },
  ];

  return (
    <div className="space-y-5">
      {/* filters — one row above the grid */}
      <div className="rounded-2xl border border-base-border bg-base-card p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Search the library</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brand, niche, product or keyword"
              className="h-10 w-full rounded-xl border border-base-border bg-base-surface pl-9 pr-9 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand/50 focus:outline-none"
            />
            {q && (
              <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted hover:text-ink-primary">
                <X size={14} />
              </button>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {selects.map((s) => (
              <FilterSelect key={s.key} label={s.label} value={filters[s.key]} options={s.options} onChange={(v) => push({ [s.key]: v })} />
            ))}
            <FilterSelect
              label="Sort"
              value={filters.sort}
              options={SORTS.map((s) => ({ value: s.id, label: s.label }))}
              onChange={(v) => push({ sort: v })}
              noAll
            />
            <button
              type="button"
              aria-pressed={filters.saved}
              onClick={() => push({ saved: filters.saved ? "" : "1" })}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
                filters.saved ? "border-brand/50 bg-brand/10 text-ink-primary" : "border-base-border bg-base-surface text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <BookmarkCheck size={14} /> Saved
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-muted">
        <p aria-live="polite">
          {total} creative{total === 1 ? "" : "s"}
          {hasFilters ? " match" : ""}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              push({ q: "", industry: "", platform: "", format: "", angle: "", saved: "" });
            }}
            className="text-brand-light hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <StateCard
          title={filters.saved && !filters.q && !filters.industry && !filters.platform && !filters.format && !filters.angle ? "Nothing saved yet" : "No creatives match these filters"}
          body={filters.saved ? "Tap the bookmark on any creative to keep it here for later." : "Try a broader search or clear a filter."}
        />
      ) : (
        <div className={`columns-1 gap-4 transition-opacity sm:columns-2 xl:columns-3 ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
          {items.map((item, i) => (
            <LibraryCard key={item.id} item={item} index={i} saved={saved.has(item.id)} onOpen={() => open(item.slug)} onSave={() => toggleSave(item)} />
          ))}
        </div>
      )}

      <p className="pt-2 text-center text-[11px] leading-relaxed text-ink-muted">
        Videos play from the brands&apos; own YouTube channels. Print ads link to their original source. Unless marked Verified Winner,
        no performance claim is made. Browsing never uses credits.
      </p>

      {active && <DetailPanel item={active} saved={saved.has(active.id)} onSave={() => toggleSave(active)} onClose={() => open(null)} />}

      {notice && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-base-border bg-[#0d0d11] px-4 py-2.5 text-sm text-ink-primary shadow-xl">
          {notice}
        </div>
      )}
    </div>
  );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function FilterSelect({
  label,
  value,
  options,
  onChange,
  noAll,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  noAll?: boolean;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full appearance-none rounded-xl border bg-base-surface pl-3 pr-8 text-sm focus:border-brand/50 focus:outline-none sm:w-auto ${
          value && !noAll ? "border-brand/50 text-ink-primary" : "border-base-border text-ink-secondary"
        }`}
      >
        {!noAll && <option value="">{label}: All</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {noAll ? o.label : `${label}: ${o.label}`}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 10 6" className="pointer-events-none absolute right-3 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-ink-muted">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  );
}

function LabelBadge({ label, solid }: { label: LibraryCreative["label"]; solid?: boolean }) {
  if (label === "verified_winner") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${solid ? "bg-brand text-white" : "bg-brand/15 text-brand-light"}`}>
        <BadgeCheck size={12} /> {LABEL_TEXT[label]}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${solid ? "border-white/15 bg-black/55 text-white backdrop-blur" : "border-base-border text-ink-secondary"}`}>
      {LABEL_TEXT[label]}
    </span>
  );
}

function Preview({ item, large }: { item: LibraryCreative; large?: boolean }) {
  if (item.preview_kind === "youtube" && item.youtube_id) {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <YoutubeThumb id={item.youtube_id} alt={`${item.brand} — ${item.title} (video thumbnail)`} label={item.brand} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition-transform group-hover:scale-110 ${large ? "h-16 w-16" : "h-11 w-11"}`}>
          <Play size={large ? 22 : 16} className="ml-0.5" fill="currentColor" />
        </span>
      </div>
    );
  }
  if (item.preview_kind === "image" && item.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.image_url}
        alt={`${item.brand} — ${item.title}`}
        width={item.image_width ?? undefined}
        height={item.image_height ?? undefined}
        loading="lazy"
        className="lib-thumb h-auto w-full object-cover"
      />
    );
  }
  // Print ads we don't re-host: show the headline as type, link to the original.
  return (
    <div className={`relative flex w-full flex-col justify-between overflow-hidden bg-[radial-gradient(120%_80%_at_0%_0%,rgba(139,92,246,0.16),transparent_60%),#101014] p-5 ${large ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">{item.platform} ad · {item.year ?? ""}</span>
      <p className={`font-semibold leading-[1.05] tracking-tight text-ink-primary ${large ? "text-5xl" : "text-[2.4rem]"}`}>{item.headline ?? item.title}</p>
      <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
        <ExternalLink size={11} /> Original ad at {item.source_label ?? "source"}
      </span>
    </div>
  );
}

/** YouTube's thumbnail; if it can't load, a quiet branded placeholder instead of broken-image text. */
function YoutubeThumb({ id, alt, label }: { id: string; alt: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex h-full w-full items-end bg-[radial-gradient(120%_90%_at_0%_0%,rgba(139,92,246,0.22),transparent_60%),#0d0d11] p-4 text-sm font-medium text-ink-secondary">
        {label}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={youtubeThumb(id)} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="lib-thumb h-full w-full object-cover" />
  );
}

function LibraryCard({
  item,
  index,
  saved,
  onOpen,
  onSave,
}: {
  item: LibraryCreative;
  index: number;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  return (
    <article
      className="lib-card group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-base-border bg-base-card transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_18px_40px_-24px_rgba(139,92,246,0.55)]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left focus-visible:outline-none" aria-label={`Open ${item.brand}: ${item.title}`}>
        <div className="relative">
          <Preview item={item} />
          <span className="absolute left-3 top-3">
            <LabelBadge label={item.label} solid />
          </span>
        </div>
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-ink-muted">
            {item.brand} · {item.industry}
          </p>
          <h3 className="mt-1 font-medium leading-snug text-ink-primary">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-secondary">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip>{FORMAT_TEXT[item.format]}</Chip>
            <Chip>{item.platform}</Chip>
            {item.angles.slice(0, 2).map((a) => (
              <Chip key={a}>{angleText(a)}</Chip>
            ))}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onSave}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full ring-1 backdrop-blur transition-colors ${
          saved ? "bg-brand text-white ring-brand" : "bg-black/55 text-white/85 ring-white/15 hover:text-white"
        }`}
      >
        {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      </button>
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-base-surface px-2 py-0.5 text-[11px] text-ink-secondary">{children}</span>;
}

function DetailPanel({ item, saved, onSave, onClose }: { item: LibraryCreative; saved: boolean; onSave: () => void; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => setPlaying(false), [item.id]);

  const rows = useMemo(
    () =>
      [
        ["Hook", item.hook],
        ["Visual strategy", item.visual_strategy],
        ["Offer", item.offer],
        ["Messaging", item.messaging],
        ["CTA", item.cta],
        ["Why it's worth studying", item.why_study],
      ].filter((r): r is [string, string] => !!r[1]),
    [item]
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="lib-detail-title">
      <button type="button" aria-label="Close" className="lib-backdrop absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="lib-panel relative flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-base-border bg-base-bg sm:rounded-l-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-base-border bg-base-bg/90 px-5 py-3 backdrop-blur">
          <LabelBadge label={item.label} />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSave}
              aria-pressed={saved}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${saved ? "text-brand-light" : "text-ink-secondary hover:text-ink-primary"}`}
            >
              {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {saved ? "Saved" : "Save"}
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-secondary outline-none hover:bg-base-surface hover:text-ink-primary focus-visible:ring-1 focus-visible:ring-brand/60">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-base-border">
            {item.preview_kind === "youtube" && item.youtube_id ? (
              playing ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={youtubeEmbed(item.youtube_id)}
                    title={`${item.brand} — ${item.title}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <button type="button" onClick={() => setPlaying(true)} className="group block w-full" aria-label={`Play ${item.title}`}>
                  <Preview item={item} large />
                </button>
              )
            ) : (
              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="block">
                <Preview item={item} large />
              </a>
            )}
          </div>

          <p className="mt-5 text-xs uppercase tracking-wide text-ink-muted">
            {item.brand} · {item.industry} · {FORMAT_TEXT[item.format]} · {item.platform}
          </p>
          <h2 id="lib-detail-title" className="mt-1 text-xl font-semibold text-ink-primary">
            {item.title}
          </h2>
          {item.attribution && <p className="mt-1 text-sm text-ink-muted">{item.attribution}</p>}
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.angles.map((a) => (
              <Chip key={a}>{angleText(a)}</Chip>
            ))}
          </div>

          {item.label === "verified_winner" && item.evidence_url && item.evidence_note ? (
            <figure className="mt-5 rounded-xl border border-brand/30 bg-brand/[0.07] p-4">
              <Quote size={14} className="text-brand-light" />
              <blockquote className="mt-1.5 text-sm leading-relaxed text-ink-primary">{item.evidence_note}</blockquote>
              <figcaption className="mt-2 text-xs text-ink-muted">
                Publicly reported results, not verified by Creatively.ai.{" "}
                <a href={item.evidence_url} target="_blank" rel="noopener noreferrer" className="text-brand-light hover:underline">
                  Read the source
                </a>
              </figcaption>
            </figure>
          ) : (
            <p className="mt-5 rounded-xl border border-base-border bg-base-card p-3 text-xs text-ink-muted">{LABEL_HELP[item.label]}</p>
          )}

          {rows.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-ink-primary">Creative breakdown</h3>
              <dl className="mt-3 divide-y divide-base-border rounded-xl border border-base-border bg-base-card">
                {rows.map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{k}</dt>
                    <dd className="text-sm leading-relaxed text-ink-secondary">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {item.test_idea && (
            <div className="mt-4 flex gap-3 rounded-xl border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-4">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand-light" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-light">Try this in your next creative</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-primary">{item.test_idea}</p>
              </div>
            </div>
          )}

          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-base-border px-4 py-2.5 text-sm text-ink-primary transition-colors hover:border-brand/40"
          >
            View original{item.source_label ? ` · ${item.source_label}` : ""} <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

function StateCard({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-base-border bg-base-surface/40 px-8 py-14 text-center">
      <AlertCircle size={20} className="text-brand-light" />
      <h3 className="mt-3 font-medium text-ink-primary">{title}</h3>
      <p className="mt-2 text-sm text-ink-secondary">{body}</p>
      {action}
    </div>
  );
}
