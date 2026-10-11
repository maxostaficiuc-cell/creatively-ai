"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

/**
 * "Learn more" control for a How It Works step. Opens a small modal card:
 * fade + scale in, closes on Escape / outside click / close button, traps
 * focus while open and returns focus to the trigger afterwards. It never
 * opens by itself.
 */
export function StepInfo({ title, text, step }: { title: string; text: string; step: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the enter/exit transition
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  const close = () => {
    setShown(false);
    window.setTimeout(() => {
      setOpen(false);
      triggerRef.current?.focus();
    }, 160);
  };

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeRef.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="hiw-learn mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-ink-secondary transition-all duration-200 hover:-translate-y-px hover:border-brand/40 hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light active:translate-y-0"
      >
        <Info size={13} className="text-brand-light" aria-hidden />
        Learn more
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px] transition-opacity duration-150 ${shown ? "opacity-100" : "opacity-0"}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={`relative w-full max-w-[min(92vw,380px)] rounded-2xl border border-white/10 bg-[#0d0d13] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(139,92,246,0.08)] transition-all duration-200 ease-out ${shown ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-light/85">Step {step}</p>
              <h4 id={titleId} className="mt-2 text-lg font-semibold text-ink-primary">
                {title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{text}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-light"
              >
                <X size={16} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
