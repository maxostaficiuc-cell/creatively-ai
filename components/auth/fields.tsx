"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Form pieces for the log-in and create-account pages. Presentational only:
// they render a normal <input>, so the pages' submit logic is unchanged.

const INPUT =
  "h-12 w-full rounded-xl border border-base-border bg-base-surface pl-11 text-base text-ink-primary outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-muted hover:border-[#34343c] focus:border-brand focus:bg-[#131318] focus:ring-4 focus:ring-brand/15 sm:text-[15px]";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Shown on the label row, right-aligned (e.g. "Forgot password?"). */
  aside?: ReactNode;
  hint?: ReactNode;
};

export function Field({ id, label, icon: Icon, aside, hint, className = "", ...input }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-secondary">
          {label}
        </label>
        {aside}
      </div>
      <div className="group relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand-light"
        />
        <input id={id} className={`${INPUT} pr-4 ${className}`} {...input} />
      </div>
      {hint}
    </div>
  );
}

export function PasswordField({ id, label, icon: Icon, aside, hint, className = "", ...input }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-secondary">
          {label}
        </label>
        {aside}
      </div>
      <div className="group relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand-light"
        />
        <input
          id={id}
          type={visible ? "text" : "password"}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={() => setCapsLock(false)}
          className={`${INPUT} pr-12 ${className}`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {capsLock && <p className="mt-2 text-xs text-amber-300/90">Caps Lock is on.</p>}
      {hint}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-accent-red/25 bg-accent-red/[0.08] px-3.5 py-3 text-sm leading-snug text-red-300"
    >
      <AlertCircle aria-hidden className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({ loading, children, loadingLabel }: { loading: boolean; children: ReactNode; loadingLabel: string }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className="h-12 w-full text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
    >
      {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {loading ? loadingLabel : children}
    </Button>
  );
}
