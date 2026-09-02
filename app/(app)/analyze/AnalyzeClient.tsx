"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ScanLine,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreativeReportView } from "@/components/marketing/CreativeReportView";
import { OutOfCreditsModal } from "@/components/dashboard/OutOfCreditsModal";
import type { Creative } from "@/lib/types";
import { CREDIT_COST_IMAGE, CREDIT_COST_VIDEO } from "@/lib/types";

type Phase = "idle" | "ready" | "scanning" | "results";

// Discrete progress steps the bar animates through while scanning, matching
// a cinematic, non-linear pace rather than a flat linear fill.
const PROGRESS_STEPS = [0, 15, 31, 48, 72, 89, 100];

export function AnalyzeClient({ credits }: { credits: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Creative | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);

  // Scanning-sequence state
  const [progress, setProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [anchors, setAnchors] = useState([false, false, false]);
  const [finalizing, setFinalizing] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resultRef = useRef<Creative | null>(null);
  const errorRef = useRef<string | null>(null);
  const insufficientCreditsRef = useRef(false);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function schedule(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  useEffect(() => () => clearTimers(), []);

  function resetAll() {
    clearTimers();
    setPhase("idle");
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    setProgress(0);
    setScanComplete(false);
    setAnchors([false, false, false]);
    setFinalizing(false);
    resultRef.current = null;
    errorRef.current = null;
  }

  function pickFile(f: File) {
    resetAll();
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    }
    setPhase("ready");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function startAnalysis() {
    if (!file) return;

    const cost = file.type.startsWith("video/") ? CREDIT_COST_VIDEO : CREDIT_COST_IMAGE;
    if (credits < cost) {
      // Known-insufficient before even attempting the upload — skip the
      // network round trip entirely. The server check further down is
      // still the real, authoritative gate; this is just a faster no.
      setOutOfCredits(true);
      return;
    }

    setError(null);
    errorRef.current = null;
    insufficientCreditsRef.current = false;

    // Kick off the real analysis request in parallel with the visual sequence.
    const analysisPromise = (async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/analyze", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          errorRef.current = data.error || "Analysis failed.";
          if (res.status === 402) insufficientCreditsRef.current = true;
          return null;
        }
        return data.creative as Creative;
      } catch {
        errorRef.current = "Something went wrong uploading your file. Please try again.";
        return null;
      }
    })();

    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      // Video gets a simpler loading state — no image scanning beam.
      setPhase("scanning");
      const creative = await analysisPromise;
      if (!creative) {
        if (insufficientCreditsRef.current) {
          setOutOfCredits(true);
        } else {
          setError(errorRef.current || "Analysis failed.");
        }
        setPhase("ready");
        return;
      }
      setResult(creative);
      resultRef.current = creative;
      setPhase("results");
      router.refresh();
      return;
    }

    setPhase("scanning");

    // Progress bar ticks across the scanning window (0.8s - 3.0s)
    const stepGap = 2200 / (PROGRESS_STEPS.length - 1);
    PROGRESS_STEPS.forEach((val, i) => {
      schedule(() => setProgress(val), 800 + i * stepGap);
    });

    // Anchor pulses while the beam travels
    schedule(() => setAnchors([true, false, false]), 1200);
    schedule(() => setAnchors([true, true, false]), 1800);
    schedule(() => setAnchors([true, true, true]), 2400);

    // Scan completes, wait for real data, then reveal results
    schedule(async () => {
      setScanComplete(true);
      const creative = await analysisPromise;

      if (!creative) {
        if (insufficientCreditsRef.current) {
          setOutOfCredits(true);
        } else {
          setError(errorRef.current || "Analysis failed.");
        }
        setPhase("ready");
        return;
      }

      setResult(creative);
      resultRef.current = creative;
      setFinalizing(false);
      setPhase("results");
    }, 3000);

    // If the API is slower than the scan animation, show a brief
    // "finalizing" state rather than an awkward frozen 100%.
    schedule(() => {
      if (!resultRef.current && !errorRef.current) setFinalizing(true);
    }, 3400);
  }

  function analyzeAnother() {
    resetAll();
    inputRef.current?.click();
  }

  const isVideoFile = file?.type.startsWith("video/");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {phase !== "results" && (
        <div className="rounded-2xl border border-base-border bg-base-card p-6 text-center text-sm text-ink-secondary">
          You have <span className="font-medium text-ink-primary">{credits.toLocaleString()}</span> AI credits.
          Images cost {CREDIT_COST_IMAGE} credits, videos cost {CREDIT_COST_VIDEO}.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickFile(f);
        }}
      />

      {/* IDLE — upload dropzone */}
      {phase === "idle" && (
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
          <Upload className="text-brand-light" size={28} />
          <p className="text-sm text-ink-secondary">
            Drag and drop an image or video
            <br />
            or click to upload
          </p>
        </div>
      )}

      {/* READY — preview before starting */}
      {phase === "ready" && (
        <div className="mx-auto max-w-md space-y-4">
          <div className="overflow-hidden rounded-2xl border border-base-border bg-base-card">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="max-h-96 w-full object-contain bg-black" />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-ink-secondary">
                {file?.name} (video)
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={resetAll}>
              Choose different file
            </Button>
            <Button className="flex-1" onClick={startAnalysis}>
              Analyze Creative <ScanLine size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* SCANNING — the cinematic sequence */}
      {phase === "scanning" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ScannerPanel
              previewUrl={previewUrl}
              isVideo={!!isVideoFile}
              progress={progress}
              scanComplete={scanComplete}
              finalizing={finalizing}
              anchors={anchors}
            />
          </div>
          {!isVideoFile && (
            <div className="hidden lg:col-span-2 lg:flex lg:flex-col lg:justify-center lg:gap-4">
              <PlaceholderCardStub tone="green" />
              <PlaceholderCardStub tone="red" />
              <PlaceholderCardStub tone="purple" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
          {error}
        </div>
      )}

      {/* RESULTS — full creative intelligence report */}
      {phase === "results" && result && (
        <div className="space-y-6">
          {result.report ? (
            <CreativeReportView
              report={result.report}
              imageUrl={previewUrl}
              isSimulated={result.is_simulated}
            />
          ) : (
            // Graceful fallback for older rows saved before the deep report existed
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="relative overflow-hidden rounded-2xl border border-base-border bg-base-surface p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Analysis complete</p>
                      <p className="mt-0.5 text-sm text-ink-secondary">{result.summary}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand/40 text-lg font-semibold text-brand-light">
                      {result.score ?? "—"}
                    </span>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-black">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="max-h-[420px] w-full object-contain" />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-ink-secondary">
                        Video creative
                      </div>
                    )}
                  </div>
                  {result.is_simulated && (
                    <p className="mt-3 text-xs text-ink-muted">
                      Simulated result — connect a real AI provider for genuine analysis.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:col-span-2">
                <ResultCard
                  tone="green"
                  title="WHAT'S GREAT"
                  icon={<CheckCircle2 size={16} />}
                  body={result.whats_working}
                  visible
                />
                <ResultCard
                  tone="red"
                  title="WHAT'S NOT GREAT"
                  icon={<XCircle size={16} />}
                  body={result.whats_not}
                  visible
                />
                <ResultCard
                  tone="purple"
                  title="WHAT YOU COULD IMPROVE"
                  icon={<TrendingUp size={16} />}
                  body={result.what_to_test}
                  visible
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-base-border bg-base-card px-5 py-3">
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Zap size={12} /> {result.credits_used} credits used
            </span>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={analyzeAnother}>
                Analyze another
              </Button>
              <Button onClick={() => router.push("/my-creatives")}>View in My Creatives</Button>
            </div>
          </div>
        </div>
      )}

      <OutOfCreditsModal open={outOfCredits} onClose={() => setOutOfCredits(false)} />
    </div>
  );
}

function ScannerPanel({
  previewUrl,
  isVideo,
  progress,
  scanComplete,
  finalizing,
  anchors,
}: {
  previewUrl: string | null;
  isVideo: boolean;
  progress: number;
  scanComplete: boolean;
  finalizing: boolean;
  anchors: boolean[];
}) {
  return (
    <div className="rounded-2xl border border-base-border bg-base-surface p-5 animate-fade-scale-in">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full border ${
            scanComplete ? "border-accent-green/50 text-accent-green" : "border-brand/40 text-brand-light"
          }`}
        >
          {scanComplete ? <CheckCircle2 size={16} /> : <ScanLine size={16} />}
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">
            {scanComplete ? "Analysis complete" : "ANALYZING CREATIVE"}
          </p>
          <p className="text-xs text-ink-secondary">
            {scanComplete ? (finalizing ? "Finalizing…" : "Preparing insights…") : "Scanning image…"}
          </p>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border border-base-border bg-black ${
          !scanComplete ? "animate-frame-pulse" : ""
        }`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-3 z-10">
          <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-accent-green/70 rounded-tl-md" />
          <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-accent-green/70 rounded-tr-md" />
          <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-accent-green/70 rounded-bl-md" />
          <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-accent-green/70 rounded-br-md" />
        </div>

        {isVideo ? (
          <div className="flex h-64 items-center justify-center text-sm text-ink-secondary">
            Preparing video…
          </div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="" className="max-h-[480px] w-full object-contain" />
        ) : null}

        {/* Scanning beam */}
        {!isVideo && !scanComplete && (
          <div
            className="animate-scan-beam pointer-events-none absolute left-0 right-0 z-20 h-[2px]"
            style={{
              background: "linear-gradient(90deg, transparent, #22C55E, transparent)",
              boxShadow: "0 0 12px 2px rgba(34,197,94,0.6)",
            }}
          />
        )}

        {/* Anchor pulses during scan */}
        {!isVideo && (
          <>
            {anchors[0] && <AnchorDot tone="green" style={{ top: "20%", right: "6px" }} pulsing />}
            {anchors[1] && <AnchorDot tone="red" style={{ top: "50%", right: "6px" }} pulsing />}
            {anchors[2] && <AnchorDot tone="purple" style={{ top: "80%", right: "6px" }} pulsing />}
          </>
        )}
      </div>

      {!isVideo && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-ink-secondary">{scanComplete ? "Analysis complete" : "Analyzing…"}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent-green transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs text-ink-secondary">{progress}%</span>
        </div>
      )}
    </div>
  );
}

const TONE_STYLES = {
  green: {
    border: "border-accent-green/40",
    text: "text-accent-green",
    bg: "bg-accent-green/10",
    dot: "bg-accent-green text-accent-green",
    line: "#22C55E",
  },
  red: {
    border: "border-accent-red/40",
    text: "text-accent-red",
    bg: "bg-accent-red/10",
    dot: "bg-accent-red text-accent-red",
    line: "#EF4444",
  },
  purple: {
    border: "border-brand/40",
    text: "text-brand-light",
    bg: "bg-brand/15",
    dot: "bg-brand text-brand",
    line: "#8B5CF6",
  },
} as const;

function AnchorDot({
  tone,
  style,
  pulsing = false,
}: {
  tone: keyof typeof TONE_STYLES;
  style: React.CSSProperties;
  pulsing?: boolean;
}) {
  const t = TONE_STYLES[tone];
  return (
    <span
      className={`absolute z-20 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${t.dot} ${
        pulsing ? "animate-pulse-anchor" : ""
      }`}
      style={style}
    />
  );
}

function ResultCard({
  tone,
  title,
  icon,
  body,
  visible,
}: {
  tone: keyof typeof TONE_STYLES;
  title: string;
  icon: React.ReactNode;
  body: string | null;
  visible: boolean;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div
      className={`rounded-2xl border ${t.border} bg-base-card p-5 transition-all duration-500 ease-out ${
        visible ? "animate-fade-scale-in opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${t.bg} ${t.text}`}>{icon}</span>
        <h4 className={`text-xs font-semibold uppercase tracking-wide ${t.text}`}>{title}</h4>
      </div>
      <p className="mt-2.5 text-sm text-ink-secondary">{body}</p>
    </div>
  );
}

function PlaceholderCardStub({ tone }: { tone: keyof typeof TONE_STYLES }) {
  const t = TONE_STYLES[tone];
  return <div className={`h-20 rounded-2xl border ${t.border} bg-base-card/40 opacity-40`} />;
}
