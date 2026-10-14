// Formatting helpers for the admin console (safe for server and client).

export const NA = "Not available";

export function fmtNum(v: number | null | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("en-US") : "—";
}

export function fmtSigned(v: number): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("en-US")}`;
}

/** Absolute timestamp, always UTC so every admin sees the same thing. */
export function fmtDateTime(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC`;
}

export function fmtDate(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
}

export function fmtAgo(v: string | null | undefined, now = Date.now()): string {
  if (!v) return "—";
  const ms = now - new Date(v).getTime();
  if (!Number.isFinite(ms)) return "—";
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 60) return `${d}d ago`;
  return fmtDate(v);
}

export function fmtMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  if (!currency) return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  try {
    return amount.toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() });
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function pctChange(cur: number, prev: number): string | null {
  if (prev === 0) return cur === 0 ? null : "new";
  const p = Math.round(((cur - prev) / prev) * 100);
  return `${p > 0 ? "+" : ""}${p}%`;
}

export function shortId(id: string | null | undefined): string {
  return id ? `${id.slice(0, 8)}…` : "—";
}
