"use client";

import { useState } from "react";
import { FreeReportModal } from "@/components/marketing/FreeReportModal";

export function GetFreeReportButton({
  className,
  variant = "primary",
  children,
}: {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const styles: Record<string, string> = {
    primary:
      "bg-gradient-to-b from-brand-light to-brand text-white shadow-glow hover:brightness-110 active:scale-[0.98]",
    secondary: "bg-base-card border border-base-border text-ink-primary hover:border-brand/50 active:scale-[0.98]",
    ghost: "text-ink-secondary hover:text-ink-primary",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${styles[variant]} ${className || ""}`}
      >
        {children || "Get Your Free Report"}
      </button>
      {open && <FreeReportModal onClose={() => setOpen(false)} />}
    </>
  );
}
