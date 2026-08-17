"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, TrendingUp, TrendingDown, FlaskConical, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Creative } from "@/lib/types";

export function AnalyzeClient({ credits }: { credits: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Creative | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        return;
      }

      setResult(data.creative);
      router.refresh();
    } catch {
      setError("Something went wrong uploading your file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-base-border bg-base-card p-6 text-center text-sm text-ink-secondary">
        You have <span className="font-medium text-ink-primary">{credits.toLocaleString()}</span> AI credits.
        Images cost 100 credits, videos cost 400.
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-14 text-center transition-colors ${
          dragOver ? "border-brand bg-brand/5" : "border-base-border bg-base-surface/40 hover:border-brand/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {loading ? (
          <>
            <Loader2 className="animate-spin text-brand-light" size={28} />
            <p className="text-sm text-ink-secondary">Analyzing your creative…</p>
          </>
        ) : (
          <>
            <Upload className="text-brand-light" size={28} />
            <p className="text-sm text-ink-secondary">
              Drag and drop an image or video
              <br />
              or click to upload
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-2xl border border-brand/40 bg-base-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/40 text-lg font-semibold text-brand-light">
                {result.score}
              </span>
              <div>
                <p className="text-sm font-medium text-ink-primary">{result.summary}</p>
                {result.is_simulated && (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Simulated result — see note below
                  </p>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Zap size={12} /> {result.credits_used} credits used
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div className="flex gap-3 rounded-xl border border-base-border bg-base-surface p-4">
              <TrendingUp size={16} className="mt-0.5 shrink-0 text-accent-green" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent-green">What&apos;s working</p>
                <p className="mt-1 text-sm text-ink-secondary">{result.whats_working}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-base-border bg-base-surface p-4">
              <TrendingDown size={16} className="mt-0.5 shrink-0 text-accent-red" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent-red">What&apos;s not</p>
                <p className="mt-1 text-sm text-ink-secondary">{result.whats_not}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-base-border bg-base-surface p-4">
              <FlaskConical size={16} className="mt-0.5 shrink-0 text-brand-light" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-light">What to test</p>
                <p className="mt-1 text-sm text-ink-secondary">{result.what_to_test}</p>
              </div>
            </div>
          </div>

          <Button variant="secondary" className="w-full" onClick={() => router.push("/my-creatives")}>
            View in My Creatives
          </Button>
        </div>
      )}
    </div>
  );
}
