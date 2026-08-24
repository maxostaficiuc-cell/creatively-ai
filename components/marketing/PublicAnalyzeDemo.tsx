"use client";

import { useRef, useState } from "react";
import { Upload, TrendingUp, TrendingDown, Sparkles, Loader2 } from "lucide-react";
import { ScoreCounter } from "@/components/marketing/ScoreCounter";

type Result = {
  score: number;
  summary: string;
  whats_working: string;
  whats_not: string;
  what_to_test: string;
};

export function PublicAnalyzeDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const fileRef = useRef<File | null>(null);

  function pickFile(file: File) {
    setError(null);
    setResult(null);
    fileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }

  async function analyze() {
    const file = fileRef.current;
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/demo-analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed. Please try again.");
        return;
      }

      setResult(data.result);
      setIsSimulated(data.isSimulated);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    fileRef.current = null;
  }

  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pickFile(file);
        }}
      />

      {/* Upload / preview panel */}
      <div className="lg:col-span-2">
        {!previewUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex h-full min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center transition-colors ${
              dragOver ? "border-brand bg-brand/5" : "border-base-border bg-base-surface/40 hover:border-brand/40"
            }`}
          >
            <Upload className="text-brand-light" size={26} />
            <p className="mt-3 text-sm text-ink-secondary">
              Drag and drop an image
              <br />
              or click to upload
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-base-border bg-base-card">
            <img src={previewUrl} alt="" className="max-h-72 w-full object-contain bg-black" />
            <div className="flex gap-2 p-3">
              <button
                onClick={reset}
                className="flex-1 rounded-lg border border-base-border py-2 text-xs text-ink-secondary transition-colors hover:text-ink-primary active:scale-[0.97]"
              >
                Choose different image
              </button>
              {!result && (
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-b from-brand-light to-brand py-2 text-xs font-medium text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
                >
                  {loading ? "Analyzing…" : "Analyze Creative"}
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-accent-red/30 bg-accent-red/5 p-3 text-xs text-accent-red">
            {error}
          </div>
        )}
      </div>

      {/* Results panel */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-base-border bg-base-card p-10 text-center">
            <Loader2 className="animate-spin text-brand-light" size={24} />
            <p className="mt-4 text-sm font-medium text-ink-primary">Analyzing your creative…</p>
            <p className="mt-1.5 text-xs text-ink-secondary">
              Checking hook, visual hierarchy, offer, CTA and conversion potential.
            </p>
          </div>
        ) : result ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-4 rounded-xl border border-brand/40 bg-base-card p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand/40 text-lg font-semibold text-brand-light">
                <ScoreCounter value={result.score} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink-primary">{result.summary}</p>
                {isSimulated && (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Simulated result — connect a real AI provider for genuine analysis.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-base-border bg-base-card p-5">
              <TrendingUp size={16} className="mt-0.5 shrink-0 text-accent-green" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent-green">What&apos;s great</p>
                <p className="mt-1.5 text-sm text-ink-secondary">{result.whats_working}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-base-border bg-base-card p-5">
              <TrendingDown size={16} className="mt-0.5 shrink-0 text-accent-red" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent-red">What&apos;s not great</p>
                <p className="mt-1.5 text-sm text-ink-secondary">{result.whats_not}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-base-border bg-base-card p-5">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-light" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-light">What you could improve</p>
                <p className="mt-1.5 text-sm text-ink-secondary">{result.what_to_test}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-base-border bg-base-surface/40 p-10 text-center">
            <p className="text-sm text-ink-secondary">
              Upload an image on the left, then click Analyze Creative to see a real score and
              feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
