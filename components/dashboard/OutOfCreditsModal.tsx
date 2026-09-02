"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function OutOfCreditsModal({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message?: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setVisible(true));
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") close();
      }
      document.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(t);
        document.removeEventListener("keydown", onKey);
      };
    } else {
      setVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[999] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border border-brand/30 bg-base-card p-6 text-center shadow-2xl transition-all duration-200 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.96] opacity-0"
        }`}
      >
        <div className="flex justify-end">
          <button onClick={close} className="text-ink-muted hover:text-ink-primary" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mx-auto -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand-light">
          <Zap size={22} />
        </div>
        <h3 className="mt-4 text-lg font-medium text-ink-primary">You&apos;re out of AI credits</h3>
        <p className="mt-2 text-sm text-ink-secondary">
          {message || "You've used all of your credits for this week. Get more credits to continue analyzing creatives."}
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => router.push("/billing")}
            className="w-full rounded-xl bg-gradient-to-b from-brand-light to-brand py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Buy More Credits
          </button>
          <button
            onClick={close}
            className="w-full rounded-xl py-2.5 text-sm text-ink-secondary hover:text-ink-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
