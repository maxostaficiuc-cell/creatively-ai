"use client";

/* eslint-disable @next/next/no-img-element -- user uploads and blob: previews, not static assets */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Annotation } from "@/lib/analyzeCreative";

export const ANN_TONE: Record<Annotation["tone"], { ring: string; fill: string; dot: string; text: string; name: string }> = {
  positive: { ring: "border-accent-green/80", fill: "bg-accent-green/10", dot: "bg-accent-green text-black", text: "text-accent-green", name: "Working" },
  negative: { ring: "border-[#F87171]/90", fill: "bg-accent-red/10", dot: "bg-[#F87171] text-black", text: "text-[#F87171]", name: "Needs work" },
  neutral: { ring: "border-brand-light/80", fill: "bg-brand/10", dot: "bg-brand-light text-black", text: "text-brand-light", name: "Note" },
};

/**
 * The creative with numbered markers over the elements the analysis talks
 * about. Boxes are approximate (the model estimates them), which the UI says.
 * `active` is shared with the insight list and with "Inspect on creative"
 * buttons elsewhere in the report.
 */
export function CreativeCanvas({
  src,
  alt,
  annotations,
  show,
  active,
  onActivate,
  className = "",
  large = false,
  onRatio,
}: {
  src: string;
  alt: string;
  annotations: Annotation[];
  show: boolean;
  active: string | null;
  onActivate?: (id: string | null) => void;
  className?: string;
  large?: boolean;
  /** Reports the image's width / height once it has loaded. */
  onRatio?: (r: number) => void;
}) {
  return (
    <div className={`relative isolate select-none ${className}`}>
      <img
        src={src}
        alt={alt}
        className="block h-auto w-full"
        draggable={false}
        onLoad={(e) => {
          const im = e.currentTarget;
          if (im.naturalWidth && im.naturalHeight) onRatio?.(im.naturalWidth / im.naturalHeight);
        }}
      />
      {show &&
        annotations.map((a, i) => {
          const t = ANN_TONE[a.tone];
          const left = Math.max(0, a.x - a.w / 2);
          const top = Math.max(0, a.y - a.h / 2);
          const width = Math.min(a.w, 1 - left);
          const height = Math.min(a.h, 1 - top);
          const isActive = active === a.id;
          const dim = active !== null && !isActive;
          return (
            <div key={a.id}>
              <div
                aria-hidden
                className={`rp-region pointer-events-none absolute rounded-md border-2 border-dashed ${t.ring} ${isActive ? t.fill : ""}`}
                data-active={isActive ? "" : undefined}
                style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` }}
              />
              <button
                type="button"
                onPointerEnter={(e) => e.pointerType === "mouse" && onActivate?.(a.id)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && onActivate?.(a.id)}
                onClick={(e) => {
                  // A mouse hover already selected it, so a click keeps it selected;
                  // a tap toggles it.
                  const mouse = (e.nativeEvent as PointerEvent).pointerType === "mouse";
                  onActivate?.(isActive && !mouse ? null : a.id);
                }}
                aria-pressed={isActive}
                aria-label={`Marker ${i + 1}: ${a.label}. ${a.note}`}
                className={`rp-marker absolute flex items-center justify-center rounded-full font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-2 ring-black/40 ${t.dot} ${
                  large ? "h-8 w-8 text-sm" : "h-6 w-6 text-xs sm:h-7 sm:w-7"
                } ${dim ? "opacity-45" : ""} ${isActive ? "scale-110" : ""}`}
                style={{
                  left: `clamp(0px, calc(${left * 100}% - 10px), calc(100% - 28px))`,
                  top: `clamp(0px, calc(${top * 100}% - 10px), calc(100% - 28px))`,
                  ["--i" as string]: i,
                }}
              >
                {i + 1}
              </button>
            </div>
          );
        })}
    </div>
  );
}

export function Lightbox({
  open,
  onClose,
  children,
  title,
  ratio = 1,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  ratio?: number;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="rp-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition-colors hover:bg-white/10"
        aria-label="Close preview"
      >
        <X size={18} aria-hidden />
      </button>
      <div
        className="w-full overflow-hidden rounded-xl"
        style={{ maxWidth: `min(92vw, calc(86vh * ${ratio}))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
