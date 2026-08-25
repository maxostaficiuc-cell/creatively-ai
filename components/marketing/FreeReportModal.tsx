"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { AnalysisSequence } from "@/components/marketing/AnalysisSequence";
import { CreativeReportView } from "@/components/marketing/CreativeReportView";
import { ButtonLink } from "@/components/ui/Button";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";
import type { CreativeReport } from "@/lib/analyzeCreative";

type Phase = "form" | "analyzing" | "result" | "already-used" | "video-blocked";

export function FreeReportModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [report, setReport] = useState<CreativeReport | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function pickFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setPhase("video-blocked");
      return;
    }
    fileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!fileRef.current) {
      setError("Please upload an image.");
      return;
    }

    setPhase("analyzing");

    try {
      const formData = new FormData();
      formData.append("file", fileRef.current);
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("device", getDeviceFingerprint());

      const res = await fetch("/api/free-report", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyUsed) {
          setPhase("already-used");
          return;
        }
        if (data.videoBlocked) {
          setPhase("video-blocked");
          return;
        }
        setError(data.error || "Something went wrong. Please try again.");
        setPhase("form");
        return;
      }

      setReport(data.report);
      setIsSimulated(data.isSimulated);
      setPhase("result");
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("form");
    }
  }

  const wide = phase === "result" || phase === "analyzing";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-10">
      <div
        className={`w-full rounded-2xl border border-base-border bg-base-card shadow-2xl transition-all ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="flex items-center justify-between border-b border-base-border p-5">
          <p className="text-sm font-medium text-ink-primary">
            {phase === "result" ? "Your Creative Report" : "Get your free creative report"}
          </p>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          {phase === "form" && (
            <>
              <p className="mb-6 text-sm text-ink-secondary">
                Upload your ad and see exactly what&apos;s working, what&apos;s hurting performance,
                and what you should test next.
              </p>

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

              {!previewUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center transition-colors ${
                    dragOver ? "border-brand bg-brand/5" : "border-base-border bg-base-surface/40 hover:border-brand/40"
                  }`}
                >
                  <Upload className="text-brand-light" size={24} />
                  <p className="mt-3 text-xs text-ink-secondary">
                    Drag and drop an image
                    <br />
                    or click to upload
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-base-border bg-black">
                  <img src={previewUrl} alt="" className="max-h-64 w-full object-contain" />
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      fileRef.current = null;
                    }}
                    className="w-full border-t border-base-border py-2 text-xs text-ink-secondary hover:text-ink-primary"
                  >
                    Remove image
                  </button>
                </div>
              )}

              <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-ink-secondary">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-base-border bg-base-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-ink-secondary">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-base-border bg-base-surface px-4 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
                    placeholder="jane@company.com"
                  />
                </div>

                {error && <p className="text-sm text-accent-red">{error}</p>}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-b from-brand-light to-brand py-3 text-sm font-medium text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Analyze My Creative
                </button>
              </form>
            </>
          )}

          {phase === "analyzing" && <AnalysisSequence imageUrl={previewUrl} />}

          {phase === "result" && report && (
            <CreativeReportView report={report} imageUrl={previewUrl} isSimulated={isSimulated} showUpgradeCta />
          )}

          {phase === "already-used" && (
            <div className="py-6 text-center">
              <p className="text-lg font-medium text-ink-primary">You&apos;ve already used your free report.</p>
              <p className="mt-2 text-sm text-ink-secondary">Ready to analyze more creatives?</p>
              <ButtonLink href="/signup" className="mt-5">
                Get Started
              </ButtonLink>
            </div>
          )}

          {phase === "video-blocked" && (
            <div className="py-6 text-center">
              <p className="text-lg font-medium text-ink-primary">Video analysis is available on paid plans.</p>
              <p className="mt-2 text-sm text-ink-secondary">
                The free report supports image creatives (JPG, PNG, WEBP). Upgrade for video analysis.
              </p>
              <ButtonLink href="/pricing" className="mt-5">
                View Plans
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
