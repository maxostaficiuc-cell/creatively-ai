// SERVER ONLY — read-only Whop API access for the admin Payments page.
// Uses the existing WHOP_COMPANY_API_KEY (never sent to the browser) and the
// company id in WHOP_COMPANY_ID. Only GET requests; nothing here can charge,
// refund, cancel or change a membership. Card details, addresses and phone
// numbers are dropped before anything leaves this module.
import { sanitizeLogText } from "@/lib/systemEvents";

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const t = (v: unknown): string | null => {
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  if (typeof v === "string" && v) {
    const d = new Date(/^\d+$/.test(v) ? Number(v) * 1000 : v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
};

export function whopReadConfigured(): { ok: true } | { ok: false; missing: string[] } {
  const missing = [!process.env.WHOP_COMPANY_API_KEY && "WHOP_COMPANY_API_KEY", !process.env.WHOP_COMPANY_ID && "WHOP_COMPANY_ID"].filter(Boolean) as string[];
  return missing.length ? { ok: false, missing } : { ok: true };
}

function baseUrl(): string {
  if (process.env.WHOP_API_BASE) return process.env.WHOP_API_BASE.replace(/\/$/, "");
  return process.env.WHOP_SANDBOX === "true" ? "https://sandbox-api.whop.com/api/v1" : "https://api.whop.com/api/v1";
}

/** Our plan name + billing interval for a Whop plan id, from the same env vars the webhook uses. */
export function planForWhopPlanId(id: string | null): { plan: string | null; interval: string | null } {
  if (!id) return { plan: null, interval: null };
  const env = process.env;
  if (env.WHOP_PLAN_ID_STARTER_TRIAL && id === env.WHOP_PLAN_ID_STARTER_TRIAL) return { plan: "Starter", interval: "$1 trial → monthly" };
  for (const plan of ["STARTER", "PRO", "BUSINESS"]) {
    for (const interval of ["MONTHLY", "ANNUAL"]) {
      if (env[`WHOP_PLAN_ID_${plan}_${interval}`] === id) {
        return { plan: plan.charAt(0) + plan.slice(1).toLowerCase(), interval: interval.toLowerCase() };
      }
    }
  }
  return { plan: null, interval: null };
}

export type WhopError = { ok: false; reason: "not_configured" | "http_error" | "network"; status?: number; message: string };

async function whopGet(path: string, params: [string, string][]): Promise<{ ok: true; body: Obj } | WhopError> {
  const cfg = whopReadConfigured();
  if (!cfg.ok) return { ok: false, reason: "not_configured", message: `Set ${cfg.missing.join(" and ")} on the server to read payments from Whop.` };
  const qs = new URLSearchParams([["account_id", process.env.WHOP_COMPANY_ID!], ...params]);
  try {
    const res = await fetch(`${baseUrl()}${path}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${process.env.WHOP_COMPANY_API_KEY}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = "";
      try {
        const j = JSON.parse(text) as Obj;
        msg = s(o(j.error)?.message) ?? s(j.message) ?? s(j.error) ?? "";
      } catch {
        /* not JSON */
      }
      const hint =
        res.status === 401 || res.status === 403
          ? " The API key may be missing permissions: payment:basic:read, member:basic:read, member:email:read, plan:basic:read."
          : "";
      return { ok: false, reason: "http_error", status: res.status, message: `Whop API returned ${res.status}${msg ? `: ${sanitizeLogText(msg, 160)}` : ""}.${hint}` };
    }
    return { ok: true, body: (await res.json()) as Obj };
  } catch (e) {
    return { ok: false, reason: "network", message: `Couldn't reach the Whop API (${sanitizeLogText(e, 80)}).` };
  }
}

export type WhopPayment = {
  id: string;
  created_at: string | null;
  paid_at: string | null;
  status: string | null;
  substatus: string | null;
  total: number | null;
  currency: string | null;
  refunded_amount: number | null;
  refunded_at: string | null;
  billing_reason: string | null;
  failure_message: string | null;
  email: string | null;
  membership_id: string | null;
  membership_status: string | null;
  plan_id: string | null;
  plan: string | null;
  interval: string | null;
  product: string | null;
};

function mapPayment(p: Obj): WhopPayment {
  const plan = planForWhopPlanId(s(o(p.plan)?.id));
  return {
    id: s(p.id) ?? "",
    created_at: t(p.created_at),
    paid_at: t(p.paid_at),
    status: s(p.status),
    substatus: s(p.substatus),
    total: n(p.total),
    currency: s(p.currency)?.toLowerCase() ?? null,
    refunded_amount: n(p.refunded_amount),
    refunded_at: t(p.refunded_at),
    billing_reason: s(p.billing_reason),
    failure_message: p.failure_message ? sanitizeLogText(p.failure_message, 160) : null,
    email: s(o(p.user)?.email)?.toLowerCase() ?? null,
    membership_id: s(o(p.membership)?.id),
    membership_status: s(o(p.membership)?.status),
    plan_id: s(o(p.plan)?.id),
    plan: plan.plan,
    interval: plan.interval,
    product: s(o(p.product)?.title),
  };
}

export const PAYMENT_FILTERS: Record<string, { label: string; substatuses: string[] }> = {
  all: { label: "All", substatuses: [] },
  succeeded: { label: "Successful", substatuses: ["succeeded"] },
  pending: { label: "Pending", substatuses: ["pending", "requires_capture", "drafted", "incomplete"] },
  failed: { label: "Failed", substatuses: ["failed", "blocked", "past_due", "uncollectible", "price_too_low", "canceled"] },
  refunded: { label: "Refunds", substatuses: ["refunded", "partially_refunded", "auto_refunded"] },
};

export type PaymentState = "succeeded" | "pending" | "failed" | "refunded" | "other";

/**
 * One state per payment, from Whop's substatus when present, otherwise its status.
 * (Whop's list endpoint can't filter by substatus, so filtering happens here.)
 */
export function paymentState(p: Pick<WhopPayment, "substatus" | "status" | "refunded_amount">): PaymentState {
  const sub = p.substatus ?? "";
  for (const k of ["succeeded", "pending", "failed", "refunded"] as const) if (PAYMENT_FILTERS[k].substatuses.includes(sub)) return k;
  if (sub) return "other";
  const st = p.status ?? "";
  if (st === "paid") return (p.refunded_amount ?? 0) > 0 ? "refunded" : "succeeded";
  if (st === "open" || st === "pending" || st === "draft" || st === "authorized") return "pending";
  if (st === "uncollectible" || st === "void" || st === "unresolved") return "failed";
  return "other";
}

export function matchesPaymentFilter(p: WhopPayment, filter: keyof typeof PAYMENT_FILTERS): boolean {
  return filter === "all" || paymentState(p) === filter;
}

/**
 * All payments created since `since`, newest first, following cursors up to `maxPages`.
 * `complete` is false when there were more pages than we read.
 */
export async function listWhopPayments(opts: { since: Date; maxPages?: number }): Promise<{ ok: true; rows: WhopPayment[]; complete: boolean } | WhopError> {
  const rows: WhopPayment[] = [];
  let after: string | null = null;
  const maxPages = opts.maxPages ?? 10;
  for (let page = 0; page < maxPages; page++) {
    const params: [string, string][] = [
      ["first", "100"],
      ["order", "created_at"],
      ["direction", "desc"],
      ["created_after", opts.since.toISOString()],
    ];
    if (after) params.push(["after", after]);
    const r = await whopGet("/payments", params);
    if (!r.ok) return r;
    const data = Array.isArray(r.body.data) ? (r.body.data as unknown[]) : [];
    for (const p of data) if (o(p)) rows.push(mapPayment(p as Obj));
    const info = o(r.body.page_info);
    if (!info?.has_next_page || !s(info.end_cursor)) return { ok: true, rows, complete: true };
    after = s(info.end_cursor);
  }
  return { ok: true, rows, complete: false };
}

export type WhopMembership = {
  id: string;
  status: string | null;
  email: string | null;
  plan_id: string | null;
  plan: string | null;
  interval: string | null;
  created_at: string | null;
  renewal_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  renewal_price: string | null;
  currency: string | null;
};

export async function listWhopMemberships(opts: { statuses: string[]; maxPages?: number }): Promise<{ ok: true; rows: WhopMembership[]; complete: boolean; total: number | null } | WhopError> {
  const rows: WhopMembership[] = [];
  let after: string | null = null;
  let total: number | null = null;
  for (let page = 0; page < (opts.maxPages ?? 5); page++) {
    const params: [string, string][] = [["first", "100"], ["order", "created_at"], ["direction", "desc"], ...opts.statuses.map((x) => ["statuses", x] as [string, string])];
    if (after) params.push(["after", after]);
    const r = await whopGet("/memberships", params);
    if (!r.ok) return r;
    total = n(r.body.total_count);
    for (const m of Array.isArray(r.body.data) ? (r.body.data as unknown[]) : []) {
      const x = o(m);
      if (!x) continue;
      const plan = planForWhopPlanId(s(o(x.plan)?.id));
      rows.push({
        id: s(x.id) ?? "",
        status: s(x.status),
        email: s(o(x.user)?.email)?.toLowerCase() ?? null,
        plan_id: s(o(x.plan)?.id),
        plan: plan.plan,
        interval: plan.interval,
        created_at: t(x.created_at),
        renewal_period_end: t(x.renewal_period_end),
        cancel_at_period_end: typeof x.cancel_at_period_end === "boolean" ? x.cancel_at_period_end : null,
        canceled_at: t(x.canceled_at),
        renewal_price: s(x.formatted_renewal_price),
        currency: s(x.currency)?.toLowerCase() ?? null,
      });
    }
    const info = o(r.body.page_info);
    if (!info?.has_next_page || !s(info.end_cursor)) return { ok: true, rows, complete: true, total };
    after = s(info.end_cursor);
  }
  return { ok: true, rows, complete: false, total };
}

/** Sums by currency. Gross = succeeded + (partially) refunded payments; refunds reported separately. */
export function summarisePayments(rows: WhopPayment[]) {
  const by: Record<string, { gross: number; refunded: number; count: number }> = {};
  let succeeded = 0, failed = 0, pending = 0, refunds = 0;
  for (const p of rows) {
    const state = paymentState(p);
    if (state === "failed") failed++;
    if (state === "pending") pending++;
    if (state === "refunded") refunds++;
    if (state === "succeeded") succeeded++;
    if ((state === "succeeded" || state === "refunded") && p.total != null && p.currency) {
      const c = (by[p.currency] ??= { gross: 0, refunded: 0, count: 0 });
      c.gross += p.total;
      c.refunded += p.refunded_amount ?? 0;
      c.count++;
    }
  }
  return { byCurrency: by, succeeded, failed, pending, refunds };
}
