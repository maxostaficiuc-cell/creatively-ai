"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EnterpriseCalendlyModal } from "@/components/marketing/EnterpriseCalendlyModal";

export function TalkToSalesButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {children || "Talk to Sales"}
      </button>
      {open && mounted && createPortal(<EnterpriseCalendlyModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
