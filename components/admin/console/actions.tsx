"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

type ApiResult = { ok: boolean; status: number; body: Record<string, unknown> };

async function postJson(url: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, body: json };
  } catch {
    return { ok: false, status: 0, body: { error: "Network error — nothing is lost. Retry safely: the same request won't be applied twice." } };
  }
}

const field = "w-full rounded-lg border border-white/[0.08] bg-[#0B0B0F] px-3 py-2 text-[13px] text-white placeholder:text-ink-muted focus:border-brand/60 focus:outline-none";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-4 py-2 text-[13px] text-ink-secondary transition-colors hover:border-white/20 hover:text-white disabled:opacity-50";
const btnDanger = "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500/90 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-50";

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl border border-white/[0.08] bg-[#0E0E13] p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-white" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-200" role="alert">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      {text}
    </p>
  );
}

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);

// ── Credits ─────────────────────────────────────────────────────────────────
export function CreditAdjustForm({ userId, email, balance, subscriptionStatus, canEdit }: { userId: string; email: string; balance: number; subscriptionStatus: string | null; canEdit: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ before: number; after: number; delta: number; replay: boolean } | null>(null);
  // One key per intended adjustment: retries after a timeout reuse it, so the
  // server applies the change at most once.
  const key = useRef(newKey());

  const n = Number(amount);
  const validAmount = /^\d+$/.test(amount) && n >= 1 && n <= 1_000_000;
  const delta = mode === "add" ? n : -n;
  const after = balance + (validAmount ? delta : 0);
  const reasonOk = reason.trim().length >= 3 && reason.trim().length <= 500;
  const tooMuch = mode === "remove" && validAmount && n > balance;

  if (!canEdit) return <p className="text-xs text-ink-muted">Viewers can see balances but can&apos;t change them.</p>;

  async function apply() {
    setPending(true);
    setError(null);
    const r = await postJson("/api/admin/control/credits", { userId, delta, reason: reason.trim(), idempotencyKey: key.current, confirm: true });
    setPending(false);
    if (!r.ok) {
      setError(String(r.body.error ?? "The adjustment failed. Nothing was changed."));
      return;
    }
    setDone({ before: Number(r.body.balance_before), after: Number(r.body.balance_after), delta: Number(r.body.delta), replay: !!r.body.replay });
    setConfirming(false);
    setAmount("");
    setReason("");
    key.current = newKey();
    router.refresh();
  }

  return (
    <div>
      <div className="inline-flex rounded-lg border border-white/[0.08] p-0.5" role="radiogroup" aria-label="Adjustment type">
        {(["add", "remove"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={clsx("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors", mode === m ? "bg-white/[0.09] text-white" : "text-ink-secondary hover:text-white")}
          >
            {m} credits
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-ink-muted">Credits</span>
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 7))} placeholder="e.g. 500" className={field} aria-invalid={!!amount && !validAmount} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-ink-muted">Reason (saved in the audit log)</span>
          <input value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} placeholder="e.g. Refund for failed export on 12 Oct" className={field} />
        </label>
      </div>
      {tooMuch ? <p className="mt-2 text-xs text-amber-200">That&apos;s more than the current balance ({balance.toLocaleString("en-US")}).</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!validAmount || !reasonOk || tooMuch} onClick={() => { setError(null); setDone(null); setConfirming(true); }} className={btnPrimary}>
          Review adjustment
        </button>
        {validAmount ? (
          <span className="text-xs tabular-nums text-ink-secondary">
            Balance {balance.toLocaleString("en-US")} → <span className="text-white">{after.toLocaleString("en-US")}</span>
          </span>
        ) : null}
      </div>
      {done ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-200" role="status">
          <Check size={14} />
          {done.replay ? "Already applied earlier (no duplicate): " : "Applied: "}
          {done.delta > 0 ? "+" : "−"}
          {Math.abs(done.delta).toLocaleString("en-US")} credits. Balance {done.before.toLocaleString("en-US")} → {done.after.toLocaleString("en-US")}.
        </p>
      ) : null}
      {confirming ? (
        <Dialog title={mode === "add" ? "Add credits?" : "Remove credits?"} onClose={() => !pending && setConfirming(false)}>
          <div className="space-y-2 text-[13px] text-ink-secondary">
            <p>
              <span className="text-white">{mode === "add" ? "Add" : "Remove"} {n.toLocaleString("en-US")} credits</span> {mode === "add" ? "to" : "from"} <span className="text-white">{email}</span>.
            </p>
            <p className="tabular-nums">
              Resulting balance: {balance.toLocaleString("en-US")} → <span className="font-semibold text-white">{after.toLocaleString("en-US")}</span>
            </p>
            <p className="text-xs text-ink-muted">Reason: “{reason.trim()}”</p>
            <p className="text-xs leading-relaxed text-ink-muted">
              {mode === "add"
                ? "Added credits are stored as bonus credits, so the weekly reset doesn't remove them (same as promotional rewards)."
                : "Removals come out of bonus credits first. The weekly plan allowance still refills at the next reset."}
            </p>
            {subscriptionStatus !== "active" ? (
              <p className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-100">
                This account has no active subscription. The app keeps unpaid balances at 0, so these credits are held as bonus and become usable once they subscribe.
              </p>
            ) : null}
          </div>
          <ErrorLine text={error} />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={btnGhost}>
              Cancel
            </button>
            <button type="button" onClick={apply} disabled={pending} className={mode === "add" ? btnPrimary : btnDanger}>
              {pending ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm {mode === "add" ? "addition" : "removal"}
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

// ── Access ──────────────────────────────────────────────────────────────────
export function AccessControl({ userId, email, status, canEdit, isSelf }: { userId: string; email: string; status: string; canEdit: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suspended = status === "suspended";
  const target = suspended ? "active" : "suspended";

  if (!canEdit) return <p className="text-xs text-ink-muted">Viewers can&apos;t change access.</p>;
  if (isSelf) return <p className="text-xs text-ink-muted">You can&apos;t change your own access.</p>;

  async function apply() {
    setPending(true);
    setError(null);
    const r = await postJson("/api/admin/control/access", { userId, status: target, reason: reason.trim(), confirm: true });
    setPending(false);
    if (!r.ok) return setError(String(r.body.error ?? "The change failed. Nothing was changed."));
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true); }} className={suspended ? btnPrimary : btnDanger}>
        {suspended ? "Restore access" : "Suspend access"}
      </button>
      {open ? (
        <Dialog title={suspended ? "Restore app access?" : "Suspend app access?"} onClose={() => !pending && setOpen(false)}>
          <div className="space-y-2 text-[13px] leading-relaxed text-ink-secondary">
            <p>
              {suspended ? "Restore" : "Suspend"} access for <span className="text-white">{email}</span>.
            </p>
            {suspended ? (
              <p>They can use the app again immediately. Their plan and credits are unchanged.</p>
            ) : (
              <p>
                They&apos;ll be blocked from the dashboard and every app API on their next request. The account and its data are <b className="text-white">not deleted</b>, and
                billing is <b className="text-white">not touched</b>: no Whop cancellation, refund or plan change. They can still reach the billing page to manage their subscription.
              </p>
            )}
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-ink-muted">Reason (saved in the audit log)</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} rows={3} className={field} placeholder={suspended ? "e.g. Issue resolved with the customer" : "e.g. Chargeback abuse — see ticket #123"} />
          </label>
          <ErrorLine text={error} />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={pending} className={btnGhost}>
              Cancel
            </button>
            <button type="button" onClick={apply} disabled={pending || reason.trim().length < 3} className={suspended ? btnPrimary : btnDanger}>
              {pending ? <Loader2 size={14} className="animate-spin" /> : null}
              {suspended ? "Confirm restore" : "Confirm suspension"}
            </button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}

// ── Notes ───────────────────────────────────────────────────────────────────
export function NoteForm({ userId, canEdit }: { userId: string; canEdit: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canEdit) return null;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const r = await postJson("/api/admin/control/notes", { userId, note: note.trim() });
        setPending(false);
        if (!r.ok) return setError(String(r.body.error ?? "Couldn't save the note."));
        setNote("");
        router.refresh();
      }}
    >
      <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} rows={2} placeholder="Internal note — never shown to the customer" className={field} aria-label="Internal note" />
      <ErrorLine text={error} />
      <button disabled={pending || !note.trim()} className={`${btnGhost} mt-2`}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : null}
        Add note
      </button>
    </form>
  );
}

// ── Health ──────────────────────────────────────────────────────────────────
export function ResolveButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const r = await postJson("/api/admin/control/health/resolve", { id, note: "" });
        setPending(false);
        setError(!r.ok);
        if (r.ok) router.refresh();
      }}
      className="rounded-md border border-white/[0.1] px-2 py-1 text-[11px] text-ink-secondary transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
    >
      {pending ? "…" : error ? "Retry" : "Mark resolved"}
    </button>
  );
}

// ── Admin roles (owners) ────────────────────────────────────────────────────
export function RoleForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "viewer" | "none">("viewer");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && reason.trim().length >= 3;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Account email" className={field} aria-label="Account email" />
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={field} aria-label="Role">
          <option value="viewer">Viewer (read-only)</option>
          <option value="admin">Admin</option>
          <option value="none">Remove access</option>
        </select>
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} placeholder="Reason (saved in the audit log)" className={`${field} mt-3`} aria-label="Reason" />
      <button type="button" disabled={!valid} onClick={() => { setMsg(null); setConfirming(true); }} className={`${btnPrimary} mt-3`}>
        Review change
      </button>
      {msg ? <p className={clsx("mt-3 text-xs", msg.ok ? "text-emerald-300" : "text-rose-300")}>{msg.text}</p> : null}
      {confirming ? (
        <Dialog title="Change admin permissions?" onClose={() => !pending && setConfirming(false)}>
          <p className="text-[13px] text-ink-secondary">
            {role === "none" ? "Remove console access for" : `Give ${role === "admin" ? "admin (can change credits and access)" : "read-only viewer"} access to`} <span className="text-white">{email.trim()}</span>.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className={role === "none" ? btnDanger : btnPrimary}
              onClick={async () => {
                setPending(true);
                const r = await postJson("/api/admin/control/admins", { email: email.trim(), role, reason: reason.trim(), confirm: true });
                setPending(false);
                setConfirming(false);
                setMsg(r.ok ? { ok: true, text: r.body.status === "unchanged" ? "No change needed." : "Saved." } : { ok: false, text: String(r.body.error ?? "Failed.") });
                if (r.ok) {
                  setEmail("");
                  setReason("");
                  router.refresh();
                }
              }}
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
