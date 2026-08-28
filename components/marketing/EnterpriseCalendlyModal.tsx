"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/trycreatively-ai/enterprise";
const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

/**
 * Full-screen booking overlay for Enterprise — same portal + backdrop +
 * centered-panel pattern as FreeReportModal, so it's visually consistent
 * with the rest of the site. Embeds the real Calendly widget rather than
 * a contact form.
 */
export function EnterpriseCalendlyModal({ onClose }: { onClose: () => void }) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const parentElement = widgetRef.current;
    if (!parentElement) return;

    function initWidget() {
      window.Calendly?.initInlineWidget({ url: CALENDLY_URL, parentElement: parentElement! });
    }

    if (window.Calendly) {
      // Script already loaded from a previous time this modal was opened —
      // Calendly's widget.js only auto-scans the DOM on its own load, so a
      // freshly-remounted widget div needs to be initialized manually.
      initWidget();
      return;
    }

    const existing = document.querySelector(`script[src="${CALENDLY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", initWidget, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = CALENDLY_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", initWidget, { once: true });
    document.body.appendChild(script);
    // Deliberately not removed on unmount — Calendly's script is safe to
    // keep loaded for next time, same as any other third-party widget script.
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  return (
    <div
      className={`fixed inset-0 z-[999] isolate flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm px-4 py-8 transition-opacity duration-200 sm:items-center ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-base-border bg-base-bg shadow-2xl transition-all duration-200 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-base-border px-6 py-4">
          <div>
            <p className="text-sm font-medium text-ink-primary">Talk to Sales</p>
            <p className="text-xs text-ink-muted">Book a time that works for you.</p>
          </div>
          <button onClick={close} className="text-ink-muted hover:text-ink-primary" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div ref={widgetRef} style={{ minWidth: 320, height: 700 }} />
        </div>
      </div>
    </div>
  );
}
