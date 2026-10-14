"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, ScanSearch, Sparkles } from "lucide-react";
import { useCredits } from "@/components/dashboard/CreditsContext";
import { CREDIT_COST_IMAGE, type Creative } from "@/lib/types";

// A generated ad saved from Creative Strategy. It has no score: it hasn't been
// analyzed or run yet. It can be sent through the regular Creative Analysis
// (normal price, confirmed first).
export function GeneratedCreativeView({ creative }: { creative: Creative }) {
  const router = useRouter();
  const credits = useCredits();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = creative.ad_copy ?? {};

  const analyze = async () => {
    if (!window.confirm(`Analyze this ad with Creative Analysis? It costs ${CREDIT_COST_IMAGE} credits.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await (await fetch(creative.file_url)).blob();
      const form = new FormData();
      form.append("file", new File([blob], `generated.${blob.type.split("/")[1] ?? "png"}`, { type: blob.type }));
      form.append("requestId", `an-${creative.id}`);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.creative) throw new Error(j.error ?? "Analysis failed.");
      if (typeof j.remainingCredits === "number") credits?.confirmCharge(j.transactionId ?? `an-${creative.id}`, Number(j.charged ?? 0), j.remainingCredits);
      router.push(`/my-creatives/${j.creative.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Analysis failed.");
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 rounded-2xl border border-base-border bg-base-card p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={creative.file_url} alt={`Generated ad: ${c.headline ?? ""}`} className="w-full rounded-xl border border-base-border" />
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] text-brand-light">
          <Sparkles size={12} /> Generated with Creative Strategy · not analyzed or tested yet
        </span>
        <h2 className="mt-3 text-xl font-semibold text-ink-primary">{c.headline ?? creative.summary}</h2>
        {c.primary_text && <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{c.primary_text}</p>}
        {c.cta && <p className="mt-3 inline-flex rounded-md border border-base-border px-2 py-0.5 text-xs text-ink-primary">{c.cta}</p>}
        <dl className="mt-5 space-y-2 text-sm">
          {c.concept && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Concept</dt>
              <dd className="text-ink-secondary">
                {c.concept.name} — {c.concept.angle} · for {c.concept.audience}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Details</dt>
            <dd className="text-ink-secondary">
              {creative.platform} · {new Date(creative.created_at).toLocaleDateString()} · {creative.credits_used} credits
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={analyze} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ScanSearch size={14} />} Analyze this ad · {CREDIT_COST_IMAGE} credits
          </button>
          {creative.generation_id && (
            <a href={`/api/strategy/generations/${creative.generation_id}/download`} className="inline-flex items-center gap-1.5 rounded-xl border border-base-border px-4 py-2.5 text-sm text-ink-secondary hover:text-ink-primary">
              <Download size={14} /> Download
            </a>
          )}
          {creative.strategy_id && (
            <Link href={`/creative-strategy?s=${creative.strategy_id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-base-border px-4 py-2.5 text-sm text-ink-secondary hover:text-ink-primary">
              Open the strategy
            </Link>
          )}
        </div>
        {err && <p className="mt-3 text-sm text-accent-red">{err}</p>}
      </div>
    </div>
  );
}
