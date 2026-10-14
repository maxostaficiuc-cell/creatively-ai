// SERVER ONLY — read models for the Admin Control Center. Every function uses the
// service-role client, so callers MUST have passed requireAdminPage/requireAdminApi.
// Columns are always listed explicitly: no tokens, secrets or payment-method data.
import { createAdminClient } from "@/lib/supabase/admin";

export type Range = "24h" | "7d" | "30d" | "90d";
export const RANGES: Range[] = ["24h", "7d", "30d", "90d"];
export const RANGE_LABEL: Record<Range, string> = { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };
const RANGE_MS: Record<Range, number> = { "24h": 864e5, "7d": 7 * 864e5, "30d": 30 * 864e5, "90d": 90 * 864e5 };

export function parseRange(v: unknown, fallback: Range = "30d"): Range {
  return typeof v === "string" && (RANGES as string[]).includes(v) ? (v as Range) : fallback;
}
export function sinceFor(range: Range, now = Date.now()): Date {
  return new Date(now - RANGE_MS[range]);
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function setupError(message: string): string {
  if (/admin_|billing_events|system_events|credit_adjustments|access_status|could not find|does not exist|schema cache/i.test(message)) {
    return "Database not ready: run supabase/migration-016-admin-control-center.sql in the Supabase SQL editor.";
  }
  return "Couldn't load this data from the database.";
}

// ── Overview ────────────────────────────────────────────────────────────────
export type Overview = {
  generated_at: string;
  since: string;
  users_total: number;
  signups: number;
  signups_prev: number;
  signed_in: number;
  active_users: number;
  paying: number;
  paying_by_plan: Record<string, number>;
  status_breakdown: Record<string, number>;
  canceling: number;
  with_membership: number;
  suspended: number;
  credits_consumed: number;
  credits_by_type: Record<string, number>;
  analyses: number;
  free_reports: number;
  generated: number;
  strategies: number;
  failed_generations: number;
  failed_strategies: number;
  refunded_charges: number;
  refunded_by_type: Record<string, number>;
  system_errors: number;
  billing_events_since: string | null;
  system_events_since: string | null;
  paid_activations: number;
  payments_succeeded: number;
  payments_failed: number;
  cohort_paying: number;
  series: { t: string; signups: number; analyses: number; generated: number; credits: number; activations: number }[];
};

export async function getOverview(range: Range): Promise<Result<Overview>> {
  const { data, error } = await createAdminClient().rpc("admin_overview", {
    p_since: sinceFor(range).toISOString(),
    p_bucket: range === "24h" ? "hour" : "day",
  });
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, data: data as Overview };
}

// ── Users ───────────────────────────────────────────────────────────────────
export type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  has_profile: boolean;
  plan: string | null;
  subscription_status: string | null;
  access_status: string;
  ai_credits: number | null;
  bonus_credits: number;
  cancel_at_period_end: boolean | null;
  credits_consumed: number;
  analyses: number;
  generated: number;
  last_activity_at: string | null;
  total_count: number;
};

export const USER_SORTS = ["created_at", "email", "credits", "consumed", "analyses", "last_sign_in", "last_activity"] as const;
export type UserSort = (typeof USER_SORTS)[number];

export type UserQuery = {
  search?: string;
  plan?: string;
  subscription?: string;
  access?: string;
  signupFrom?: string;
  signupTo?: string;
  sort?: UserSort;
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export async function listUsers(q: UserQuery): Promise<{ ok: true; rows: UserRow[]; total: number } | { ok: false; error: string }> {
  const { data, error } = await createAdminClient().rpc("admin_list_users", {
    p_search: q.search?.trim() || null,
    p_plan: q.plan || null,
    p_subscription: q.subscription || null,
    p_access: q.access || null,
    p_signup_from: q.signupFrom || null,
    p_signup_to: q.signupTo || null,
    p_sort: q.sort ?? "created_at",
    p_dir: q.dir ?? "desc",
    p_limit: q.limit ?? 25,
    p_offset: q.offset ?? 0,
  });
  if (error) return { ok: false, error: setupError(error.message) };
  const rows = (data ?? []) as UserRow[];
  return { ok: true, rows, total: rows[0]?.total_count ?? (q.offset ? -1 : 0) };
}

// ── One user ────────────────────────────────────────────────────────────────
export type LedgerEntry = {
  at: string;
  kind: "analysis" | "image_generation" | "admin_adjustment" | "promo_bonus" | "other";
  delta: number | null; // signed; null when nothing was finally charged
  status: string;
  detail: string;
  balanceAfter: number | null;
  ref: string;
  actor?: string | null;
};

export type UserDetail = {
  user: UserRow;
  profile: Record<string, unknown> | null;
  ledger: LedgerEntry[];
  analyses: { id: string; created_at: string; file_type: string | null; platform: string | null; score: number | null; credits_used: number | null; source: string | null; is_simulated: boolean | null }[];
  generations: { id: string; created_at: string; status: string; credits_charged: number; error: string | null; strategy_id: string }[];
  strategies: { id: string; created_at: string; brand_name: string | null; status: string; version: number }[];
  notes: { id: string; created_at: string; admin_email: string | null; note: string }[];
  audit: AuditRow[];
  billing: BillingEventRow[];
  adminRole: string | null;
};

const PROFILE_COLUMNS =
  "id,full_name,email,plan,subscription_status,ai_credits,bonus_credits,credits_reset_at,cancel_at_period_end,whop_membership_id,access_status,access_changed_at,onboarding_completed,persona,created_at,updated_at";

function kindFor(mediaType: string | null): LedgerEntry["kind"] {
  if (mediaType === "generated_image") return "image_generation";
  if (mediaType === "image" || mediaType === "video") return "analysis";
  return "other";
}

export async function getUserDetail(id: string): Promise<Result<UserDetail | null>> {
  const db = createAdminClient();
  const { data: users, error } = await db.rpc("admin_list_users", { p_user_id: id, p_limit: 1 });
  if (error) return { ok: false, error: setupError(error.message) };
  const user = ((users ?? []) as UserRow[])[0];
  if (!user) return { ok: true, data: null };

  const [profile, tx, adj, rewards, analyses, generations, strategies, notes, audit, billing, role] = await Promise.all([
    db.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle(),
    db.from("credit_transactions").select("id,request_id,amount,media_type,status,creative_id,balance_after,created_at,updated_at").eq("user_id", id).order("created_at", { ascending: false }).limit(200),
    db.from("credit_adjustments").select("id,created_at,admin_email,delta,reason,balance_after").eq("user_id", id).order("created_at", { ascending: false }).limit(200),
    db.from("reward_grants").select("id,program_id,status,amount,reason,granted_at,reserved_at,balance_after").eq("user_id", id).limit(50),
    db.from("creatives").select("id,created_at,file_type,platform,score,credits_used,source,is_simulated").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    db.from("strategy_generations").select("id,created_at,status,credits_charged,error,strategy_id").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    db.from("brand_strategies").select("id,created_at,brand_name,status,version").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    db.from("admin_user_notes").select("id,created_at,admin_email,note").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
    db.from("admin_audit_log").select(AUDIT_COLUMNS).eq("target_user_id", id).order("created_at", { ascending: false }).limit(100),
    user.email
      ? db.from("billing_events").select(BILLING_COLUMNS).eq("email", user.email.toLowerCase()).order("received_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),
    db.from("admin_users").select("role").eq("user_id", id).is("revoked_at", null).maybeSingle(),
  ]);

  const ledger: LedgerEntry[] = [];
  for (const t of (tx.data ?? []) as { id: string; request_id: string; amount: number; media_type: string | null; status: string; balance_after: number | null; created_at: string; updated_at: string }[]) {
    const kind = kindFor(t.media_type);
    const label = kind === "image_generation" ? "Generated ad image" : kind === "analysis" ? `Creative analysis (${t.media_type})` : t.media_type ?? "Charge";
    ledger.push({
      at: t.created_at,
      kind,
      delta: t.status === "settled" ? -t.amount : t.status === "reserved" ? -t.amount : null,
      status: t.status === "released" ? (t.balance_after == null ? "declined" : "refunded") : t.status,
      detail:
        t.status === "released"
          ? t.balance_after == null
            ? `${label} — not charged (insufficient credits or inactive plan)`
            : `${label} — failed, ${t.amount.toLocaleString("en-US")} credits returned`
          : t.status === "reserved"
            ? `${label} — in progress (held)`
            : label,
      balanceAfter: t.balance_after,
      ref: t.request_id,
    });
  }
  for (const a of (adj.data ?? []) as { id: string; created_at: string; admin_email: string | null; delta: number; reason: string; balance_after: number }[]) {
    ledger.push({ at: a.created_at, kind: "admin_adjustment", delta: a.delta, status: "applied", detail: a.reason, balanceAfter: a.balance_after, ref: a.id, actor: a.admin_email });
  }
  for (const g of (rewards.data ?? []) as { id: string; program_id: string; status: string; amount: number; reason: string; granted_at: string | null; reserved_at: string; balance_after: number | null }[]) {
    ledger.push({
      at: g.granted_at ?? g.reserved_at,
      kind: "promo_bonus",
      delta: g.status === "granted" ? g.amount : null,
      status: g.status,
      detail: `${g.program_id}: ${g.reason}`,
      balanceAfter: g.balance_after,
      ref: g.id,
    });
  }
  ledger.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    ok: true,
    data: {
      user,
      profile: (profile.data as Record<string, unknown> | null) ?? null,
      ledger,
      analyses: (analyses.data ?? []) as UserDetail["analyses"],
      generations: ((generations.data ?? []) as UserDetail["generations"]).map((g) => ({ ...g, error: g.error ? g.error.slice(0, 200) : null })),
      strategies: (strategies.data ?? []) as UserDetail["strategies"],
      notes: (notes.data ?? []) as UserDetail["notes"],
      audit: (audit.data ?? []) as AuditRow[],
      billing: (billing.data ?? []) as BillingEventRow[],
      adminRole: (role.data as { role?: string } | null)?.role ?? null,
    },
  };
}

// ── Audit log ───────────────────────────────────────────────────────────────
export type AuditRow = {
  id: number;
  created_at: string;
  admin_id: string;
  admin_email: string | null;
  target_user_id: string | null;
  action: string;
  reason: string | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};
const AUDIT_COLUMNS = "id,created_at,admin_id,admin_email,target_user_id,action,reason,before_value,after_value,metadata";

export async function listAudit(opts: { action?: string; target?: string; prefix?: string; limit?: number; offset?: number }): Promise<{ ok: true; rows: AuditRow[]; total: number } | { ok: false; error: string }> {
  let q = createAdminClient().from("admin_audit_log").select(AUDIT_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  if (opts.action) q = q.eq("action", opts.action);
  if (opts.prefix) q = q.like("action", `${opts.prefix.replace(/[%_]/g, "")}%`);
  if (opts.target) q = q.eq("target_user_id", opts.target);
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, rows: (data ?? []) as AuditRow[], total: count ?? 0 };
}

/** user id → email, for labelling audit/adjustment rows. */
export async function emailsFor(ids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 200);
  if (!unique.length) return {};
  const { data } = await createAdminClient().from("profiles").select("id,email").in("id", unique);
  return Object.fromEntries(((data ?? []) as { id: string; email: string | null }[]).map((r) => [r.id, r.email ?? ""]));
}

// ── Credits ─────────────────────────────────────────────────────────────────
export type AdjustmentRow = { id: string; created_at: string; user_id: string; admin_email: string | null; delta: number; reason: string; balance_before: number; balance_after: number; subscription_status: string | null };

export async function listAdjustments(limit = 50, offset = 0): Promise<{ ok: true; rows: AdjustmentRow[]; total: number } | { ok: false; error: string }> {
  const { data, error, count } = await createAdminClient()
    .from("credit_adjustments")
    .select("id,created_at,user_id,admin_email,delta,reason,balance_before,balance_after,subscription_status", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, rows: (data ?? []) as AdjustmentRow[], total: count ?? 0 };
}

// ── Billing events (verified webhooks) ─────────────────────────────────────
export type BillingEventRow = {
  id: string;
  type: string;
  received_at: string;
  occurred_at: string | null;
  email: string | null;
  matched_user_id: string | null;
  outcome: string | null;
  whop_payment_id: string | null;
  whop_membership_id: string | null;
  whop_plan_id: string | null;
  plan: string | null;
  status: string | null;
  substatus: string | null;
  billing_reason: string | null;
  amount: number | null;
  currency: string | null;
  refunded_amount: number | null;
  paid_at: string | null;
};
const BILLING_COLUMNS =
  "id,type,received_at,occurred_at,email,matched_user_id,outcome,whop_payment_id,whop_membership_id,whop_plan_id,plan,status,substatus,billing_reason,amount,currency,refunded_amount,paid_at";

export async function listBillingEvents(opts: { types?: string[]; since?: Date; limit?: number }): Promise<{ ok: true; rows: BillingEventRow[] } | { ok: false; error: string }> {
  let q = createAdminClient().from("billing_events").select(BILLING_COLUMNS).order("received_at", { ascending: false }).limit(opts.limit ?? 100);
  if (opts.types?.length) q = q.in("type", opts.types);
  if (opts.since) q = q.gte("received_at", opts.since.toISOString());
  const { data, error } = await q;
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, rows: (data ?? []) as BillingEventRow[] };
}

/** App-side entitlement state (written only by the verified webhook). */
export async function listSubscribers(): Promise<{ ok: true; rows: { id: string; email: string | null; plan: string | null; subscription_status: string; cancel_at_period_end: boolean; whop_membership_id: string | null; credits_reset_at: string | null }[] } | { ok: false; error: string }> {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id,email,plan,subscription_status,cancel_at_period_end,whop_membership_id,credits_reset_at")
    .neq("subscription_status", "unpaid")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, rows: (data ?? []) as never };
}

export async function listPendingGrants(): Promise<{ email: string; plan: string; created_at: string }[]> {
  const { data } = await createAdminClient().from("pending_grants").select("email,plan,created_at").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as { email: string; plan: string; created_at: string }[];
}

// ── System health ───────────────────────────────────────────────────────────
export type SystemEventRow = { id: number; created_at: string; category: string; severity: string; source: string; code: string | null; message: string | null; user_id: string | null; ref_id: string | null; resolved_at: string | null; resolution_note: string | null };

export type Health = {
  events: SystemEventRow[];
  eventsError: string | null;
  eventsSince: string | null;
  failedGenerations: { id: string; user_id: string; updated_at: string; error: string | null; attempts: number }[];
  failedStrategies: { id: string; user_id: string; updated_at: string; brand_name: string | null }[];
  refunded: { request_id: string; user_id: string; media_type: string | null; amount: number; updated_at: string }[];
  stuckReservations: { request_id: string; user_id: string; media_type: string | null; amount: number; created_at: string }[];
  stuckGenerations: { id: string; user_id: string; updated_at: string; attempts: number }[];
  pendingGrants: { email: string; plan: string; created_at: string }[];
  webhooksProcessed: number | null;
  lastWebhookAt: string | null;
};

export async function getHealth(range: Range): Promise<Health> {
  const db = createAdminClient();
  const since = sinceFor(range).toISOString();
  const threeMinAgo = new Date(Date.now() - 3 * 60_000).toISOString();
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const [events, first, gens, strats, refunded, stuck, stuckGen, grants, webhooks, lastWebhook] = await Promise.all([
    db.from("system_events").select("id,created_at,category,severity,source,code,message,user_id,ref_id,resolved_at,resolution_note").gte("created_at", since).order("created_at", { ascending: false }).limit(200),
    db.from("system_events").select("created_at").order("created_at", { ascending: true }).limit(1),
    db.from("strategy_generations").select("id,user_id,updated_at,error,attempts").eq("status", "failed").gte("updated_at", since).order("updated_at", { ascending: false }).limit(50),
    db.from("brand_strategies").select("id,user_id,updated_at,brand_name").eq("status", "failed").gte("updated_at", since).order("updated_at", { ascending: false }).limit(50),
    db.from("credit_transactions").select("request_id,user_id,media_type,amount,updated_at").eq("status", "released").not("balance_after", "is", null).gte("updated_at", since).order("updated_at", { ascending: false }).limit(50),
    db.from("credit_transactions").select("request_id,user_id,media_type,amount,created_at").eq("status", "reserved").lt("created_at", threeMinAgo).order("created_at", { ascending: true }).limit(50),
    db.from("strategy_generations").select("id,user_id,updated_at,attempts").eq("status", "generating").lt("updated_at", fiveMinAgo).limit(50),
    listPendingGrants(),
    db.from("webhook_events").select("id", { count: "exact", head: true }).gte("processed_at", since),
    db.from("webhook_events").select("processed_at").order("processed_at", { ascending: false }).limit(1),
  ]);
  return {
    events: (events.data ?? []) as SystemEventRow[],
    eventsError: events.error ? setupError(events.error.message) : null,
    eventsSince: ((first.data ?? []) as { created_at: string }[])[0]?.created_at ?? null,
    failedGenerations: ((gens.data ?? []) as Health["failedGenerations"]).map((g) => ({ ...g, error: g.error?.slice(0, 200) ?? null })),
    failedStrategies: (strats.data ?? []) as Health["failedStrategies"],
    refunded: (refunded.data ?? []) as Health["refunded"],
    stuckReservations: (stuck.data ?? []) as Health["stuckReservations"],
    stuckGenerations: (stuckGen.data ?? []) as Health["stuckGenerations"],
    pendingGrants: grants,
    webhooksProcessed: webhooks.error ? null : webhooks.count ?? 0,
    lastWebhookAt: ((lastWebhook.data ?? []) as { processed_at: string }[])[0]?.processed_at ?? null,
  };
}

// ── Admins ──────────────────────────────────────────────────────────────────
export async function listAdmins(): Promise<{ ok: true; rows: { user_id: string; email: string; role: string; granted_at: string }[] } | { ok: false; error: string }> {
  const { data, error } = await createAdminClient().rpc("admin_list_admins");
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, rows: (data ?? []) as never };
}

// ── Signup funnel ───────────────────────────────────────────────────────────
export type Funnel = { signups: number; confirmed: number; onboarded: number; used_product: number; paying_now: number; ever_paid: number };
export async function getFunnel(range: Range): Promise<Result<Funnel>> {
  const { data, error } = await createAdminClient().rpc("admin_funnel", { p_since: sinceFor(range).toISOString() });
  if (error) return { ok: false, error: setupError(error.message) };
  return { ok: true, data: data as Funnel };
}
