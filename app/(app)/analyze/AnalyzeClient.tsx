"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle, TrendingUp, ScanLine, Zap, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreativeReportView } from "@/components/marketing/CreativeReportView";
import { OutOfCreditsModal } from "@/components/dashboard/OutOfCreditsModal";
import { useCredits } from "@/components/dashboard/CreditsContext";
import type { Creative } from "@/lib/types";
import { CREDIT_COST_IMAGE } from "@/lib/types";
import { ANALYZE_ERRORS, type AnalyzeErrorBody, type AnalyzeErrorCode } from "@/lib/analyzeErrors";
import { prepareImageForUpload } from "@/lib/imagePrep";

type Phase = "idle" | "ready" | "scanning" | "results";
type Stage = "preparing" | "analyzing" | "done";

type FailState = {
  code: AnalyzeErrorCode;
  title: string;
  message: string;
  retryable: boolean;
  /** false = server confirmed no charge; null = not confirmed */
  charged: boolean | null;
};
type Success = { charged: number; remaining: number | null; replay: boolean };

const newRequestId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AnalyzeClient({ credits: initialCredits }: { credits: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const creditsCtx = useCredits();
  const credits = creditsCtx?.balance ?? initialCredits;

  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fail, setFail] = useState<FailState | null>(null);
  const [result, setResult] = useState<Creative | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);

  // Scanning visuals (decorative) + honest status
  const [stage, setStage] = useState<Stage>("preparing");
  const [elapsed, setElapsed] = useState(0);
  const [anchors, setAnchors] = useState([false, false, false]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);
  /** Reused when the previous attempt's outcome is unknown, so a retry can't charge twice. */
  const requestIdRef = useRef<string | null>(null);
  /** Upload-ready version of the file (resized once, reused on retry). */
  const preparedRef = useRef<{ src: File; out: File } | null>(null);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }
  useEffect(() => () => clearTimers(), []);

  function resetAll() {
    clearTimers();
    busy.current = false;
    requestIdRef.current = null;
    preparedRef.current = null;
    setPhase("idle");
    setFile(null);
    setPreviewUrl(null);
    setFail(null);
    setResult(null);
    setSuccess(null);
    setAnchors([false, false, false]);
    setStage("preparing");
    setElapsed(0);
  }

  function pickFile(f: File) {
    resetAll();
    setFile(f);
    if (f.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(f));
    setPhase("ready");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  const isVideoFile = !!file?.type.startsWith("video/");
  // Videos get a labelled preview result and are not charged.
  const cost = isVideoFile ? 0 : CREDIT_COST_IMAGE;

  /** One HTTP attempt. Never throws; always resolves to a typed outcome. */
  async function send(upload: File, requestId: string): Promise<
    | { ok: true; creative: Creative; charged: number; remaining: number | null; transactionId: string | null; replay: boolean }
    | { ok: false; body: AnalyzeErrorBody | null; status: number; indeterminate: boolean }
  > {
    const form = new FormData();
    form.append("file", upload);
    form.append("requestId", requestId);
    let res: Response;
    try {
      res = await fetch("/api/analyze", { method: "POST", body: form, signal: AbortSignal.timeout?.(60_000) });
    } catch {
      // Connection dropped or timed out: the server may still have finished.
      return { ok: false, body: null, status: 0, indeterminate: true };
    }
    const text = await res.text().catch(() => "");
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (res.ok && data && data.creative) {
      return {
        ok: true,
        creative: data.creative as Creative,
        charged: Number(data.charged ?? 0),
        remaining: typeof data.remainingCredits === "number" ? data.remainingCredits : null,
        transactionId: (data.transactionId as string) ?? null,
        replay: !!data.replay,
      };
    }
    if (data && typeof data.code === "string") return { ok: false, body: data as AnalyzeErrorBody, status: res.status, indeterminate: false };
    // A non-JSON answer comes from the hosting platform, not our code
    // (request too large, function limit). Outcome unknown unless it's a 413.
    return { ok: false, body: null, status: res.status, indeterminate: res.status !== 413 };
  }

  async function startAnalysis() {
    if (!file || busy.current) return; // no double submits
    if (credits < cost) {
      setOutOfCredits(true);
      return;
    }
    busy.current = true;
    setFail(null);
    setSuccess(null);
    clearTimers();
    setPhase("scanning");
    setStage("preparing");
    setElapsed(0);
    setAnchors([false, false, false]);
    const started = Date.now();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
      timers.current.push(setTimeout(tick, 1000));
    };
    timers.current.push(setTimeout(tick, 1000));
    timers.current.push(setTimeout(() => setAnchors([true, false, false]), 1200));
    timers.current.push(setTimeout(() => setAnchors([true, true, false]), 2400));
    timers.current.push(setTimeout(() => setAnchors([true, true, true]), 3600));

    // Resize once; a retry reuses the same upload.
    if (!preparedRef.current || preparedRef.current.src !== file) {
      preparedRef.current = { src: file, out: await prepareImageForUpload(file) };
    }
    const upload = preparedRef.current.out;
    setStage("analyzing");

    const requestId = requestIdRef.current ?? newRequestId();
    requestIdRef.current = requestId;

    let outcome = await send(upload, requestId);
    // Recover instead of duplicating: the same request may still be finishing,
    // or the provider asked us to wait a moment. Bounded, same request id.
    for (let i = 0; i < 4 && !outcome.ok; i++) {
      const code = outcome.body?.code;
      const shortWait = code === "rate_limited" && (outcome.body?.retryAfter ?? 3) <= 10;
      if (code === "in_progress" || shortWait) {
        await wait(code === "in_progress" ? 5000 : Math.max(1500, (outcome.body?.retryAfter ?? 3) * 1000));
        outcome = await send(upload, requestId);
        continue;
      }
      if (outcome.indeterminate && i === 0) {
        await wait(2000);
        outcome = await send(upload, requestId);
        continue;
      }
      break;
    }

    clearTimers();
    busy.current = false;

    if (outcome.ok) {
      setStage("done");
      requestIdRef.current = null;
      if (!outcome.replay && outcome.charged > 0 && outcome.remaining !== null) {
        // Server-confirmed charge: update both credit displays and animate.
        creditsCtx?.confirmCharge(outcome.transactionId ?? requestId, outcome.charged, outcome.remaining);
      }
      setSuccess({ charged: outcome.replay ? 0 : outcome.charged, remaining: outcome.remaining, replay: outcome.replay });
      setResult(outcome.creative);
      setPhase("results");
      router.refresh(); // re-read the balance from the database everywhere
      return;
    }

    const body = outcome.body;
    if (body?.code === "insufficient_credits" || body?.code === "plan_inactive") {
      requestIdRef.current = null;
      setPhase("ready");
      setOutOfCredits(true);
      router.refresh();
      return;
    }
    // Without a JSON body the reply came from the network or the hosting platform.
    const code: AnalyzeErrorCode =
      body?.code ??
      (outcome.status === 413
        ? "file_too_large"
        : outcome.status === 0
          ? "upload_failed"
          : outcome.status >= 500
            ? "ai_timeout"
            : "server_error");
    const def = ANALYZE_ERRORS[code];
    // A definite failure gets a fresh id next time; an unknown outcome keeps it.
    if (!outcome.indeterminate) requestIdRef.current = null;
    setFail({
      code,
      title: def.title,
      message: body?.error ?? def.message,
      retryable: body?.retryable ?? def.retryable,
      charged: body ? body.charged : null,
    });
    setPhase("ready");
    if (body?.charged !== false) router.refresh();
  }

  function analyzeAnother() {
    resetAll();
    inputRef.current?.click();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {phase !== "results" && (
        <div className="rounded-2xl border border-base-border bg-base-card p-6 text-center text-sm text-ink-secondary">
          You have <span className="font-medium text-ink-primary">{credits.toLocaleString()}</span> AI credits.{" "}
          {file && phase === "ready" ? (
            isVideoFile ? (
              <>Video analysis is in preview and isn&apos;t charged.</>
            ) : (
              <>
                This image analysis uses <span className="font-medium text-ink-primary">{CREDIT_COST_IMAGE} credits</span>, charged only
                when your report is ready.
              </>
            )
          ) : (
            <>Image analysis: {CREDIT_COST_IMAGE} credits, charged only when your report is ready.</>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickFile(f);
          e.target.value = "";
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
          <p className="text-xs text-ink-muted">JPG, PNG, WebP or GIF. Large images are resized automatically.</p>
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
            <Button variant="secondary" className="flex-1" onClick={() => inputRef.current?.click()}>
              Choose different file
            </Button>
            <Button className="flex-1" onClick={startAnalysis} disabled={busy.current}>
              {fail?.retryable ? (
                <>
                  {fail.code === "upload_failed" || fail.code === "storage_failed" ? "Retry upload" : "Retry analysis"} <RotateCcw size={15} />
                </>
              ) : (
                <>
                  Analyze Creative <ScanLine size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {fail && phase === "ready" && <FailCard fail={fail} />}

      {/* SCANNING */}
      {phase === "scanning" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ScannerPanel previewUrl={previewUrl} isVideo={isVideoFile} stage={stage} elapsed={elapsed} anchors={anchors} />
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

      {/* RESULTS — full creative intelligence report */}
      {phase === "results" && result && (
        <div className="space-y-6">
          {success && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-secondary" role="status">
              <CheckCircle2 size={14} className="text-accent-green" aria-hidden />
              <span className="text-ink-primary">Analysis complete</span>
              {success.charged > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span>{success.charged} credits used</span>
                </>
              )}
              {success.replay && (
                <>
                  <span aria-hidden>·</span>
                  <span>already saved, no new charge</span>
                </>
              )}
              {success.remaining !== null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{success.remaining.toLocaleString()} credits remaining</span>
                </>
              )}
            </p>
          )}
          {result.report ? (
            <CreativeReportView
              report={result.report}
              imageUrl={previewUrl}
              isSimulated={result.is_simulated}
              reportId={result.id}
              onReanalyze={() => {
                resetAll();
                document.querySelector("main")?.scrollTo({ top: 0 });
              }}
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
  stage,
  elapsed,
  anchors,
}: {
  previewUrl: string | null;
  isVideo: boolean;
  stage: Stage;
  elapsed: number;
  anchors: boolean[];
}) {
  const scanComplete = stage === "done";
  const status =
    stage === "preparing"
      ? "Preparing your image…"
      : elapsed < 20
        ? "Reading the creative and writing your report…"
        : "Still working, almost there…";
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
          <p className="text-sm font-medium text-ink-primary">{scanComplete ? "Analysis complete" : "ANALYZING CREATIVE"}</p>
          <p className="text-xs text-ink-secondary" aria-live="polite">
            {scanComplete ? "Opening your report…" : status}
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

      {/* No percentage: we can't know how far along the AI is, so we show time, not a made-up number. */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-base-border">
          {scanComplete ? (
            <div className="h-full w-full rounded-full bg-gradient-to-r from-brand to-accent-green" />
          ) : (
            <div className="analyze-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent" />
          )}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-ink-secondary">
          {scanComplete ? "Done" : `${elapsed}s · usually 15–25s`}
        </span>
      </div>
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

function FailCard({ fail }: { fail: FailState }) {
  const isAnalysis = ANALYZE_ERRORS[fail.code].kind === "analysis";
  return (
    <div role="alert" className="mx-auto max-w-md rounded-xl border border-accent-red/30 bg-accent-red/[0.06] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#FCA5A5]">
        <AlertTriangle size={15} aria-hidden /> {fail.title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{fail.message}</p>
      {fail.charged === false && (
        <p className="mt-2 text-xs text-ink-muted">Your credits have not been charged.</p>
      )}
      {fail.charged === null && (
        <p className="mt-2 text-xs text-ink-muted">
          If credits were held for this attempt, they return automatically within a few minutes.
        </p>
      )}
      {fail.code === "session_expired" ? (
        <Link href="/login" className="mt-3 inline-flex text-xs font-medium text-brand-light hover:underline">
          Log in again →
        </Link>
      ) : (
        isAnalysis && (
          <p className="mt-3 text-xs text-ink-muted">
            Keeps happening?{" "}
            <Link href="/contact" className="font-medium text-brand-light hover:underline">
              Contact support
            </Link>
          </p>
        )
      )}
    </div>
  );
}
