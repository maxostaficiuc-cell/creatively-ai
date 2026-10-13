"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Status = {
  program: { amount: number; launched_at: string | null };
  reserved: number;
  granted: number;
  integrations: { id: string; name: string; status: string }[];
  canLaunch: boolean;
};

export function RewardsAdmin() {
  const [s, setS] = useState<Status | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/rewards");
    const json = await res.json();
    if (!res.ok) setMsg(json.error ?? "Could not load.");
    else setS(json);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const launch = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `Done: ${json.result?.granted_now ?? 0} granted now, ${json.result?.still_reserved ?? 0} still waiting (inactive accounts).` : json.error ?? "Failed.");
    setConfirm("");
    load();
  };

  if (!s) return <p className="mt-8 text-sm text-ink-secondary">{msg ?? "Loading…"}</p>;
  return (
    <div className="mt-8 space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Reserved" value={s.reserved} />
        <Stat label="Granted" value={s.granted} />
        <Stat label="Bonus each" value={s.program.amount} />
      </div>
      <div className="rounded-xl border border-base-border bg-base-card p-4 text-ink-secondary">
        <p>Program: {s.program.launched_at ? `launched ${new Date(s.program.launched_at).toLocaleString()}` : "not launched — no credits have been paid out."}</p>
        <ul className="mt-2 space-y-1">
          {s.integrations.map((i) => (
            <li key={i.id}>
              {i.name}: <span className={i.status === "available" ? "text-accent-green" : "text-ink-muted"}>{i.status === "available" ? "live" : "coming soon"}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-base-border bg-base-card p-4">
        <p className="text-ink-secondary">
          Launch marks the program as launched (new sign-ups stop qualifying) and credits every reserved reward to accounts that are paying now.
          You can run it again later to pay accounts that reactivate. It never pays anyone twice.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type LAUNCH"
            disabled={!s.canLaunch}
            className="h-10 flex-1 rounded-lg border border-base-border bg-base-surface px-3 text-ink-primary disabled:opacity-50"
          />
          <button
            type="button"
            disabled={!s.canLaunch || confirm !== "LAUNCH" || busy}
            onClick={launch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 text-white disabled:opacity-40"
          >
            {busy && <Loader2 size={14} className="animate-spin" />} {s.program.launched_at ? "Grant waiting rewards" : "Launch & grant"}
          </button>
        </div>
        {!s.canLaunch && <p className="mt-2 text-xs text-ink-muted">Disabled until an ad-account integration is live.</p>}
      </div>
      {msg && <p className="text-ink-secondary">{msg}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-card p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-ink-primary">{value.toLocaleString()}</p>
    </div>
  );
}
