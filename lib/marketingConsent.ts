// SERVER ONLY — explicit marketing-email consent → our record → Loops.
//
//   recordMarketingConsent()  called only when a person ticked an opt-in box
//                             (free-report form, or sign-up after the email is
//                             confirmed). Saves the consent, then adds/updates
//                             the Loops contact on the marketing mailing list.
//   syncPendingConsents()     retries any consent whose Loops sync failed
//                             (admin console button). Safe to run any time.
//
// Idempotent: the record is keyed by email and Loops contacts are upserted by
// email, so retries and repeat opt-ins never create duplicates. Never throws.
// People who didn't opt in never reach this file.
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertLoopsContact } from "@/lib/loops";
import { CONSENT_TEXT, type ConsentSource } from "@/lib/consentText";

const LOOPS_SOURCE: Record<ConsentSource, string> = { free_report: "Free report", signup: "Sign-up" };
const USER_GROUP: Record<ConsentSource, string> = { free_report: "Free report lead", signup: "App user" };

/** The Loops mailing list consenting contacts are added to (LOOPS_FREE_REPORT_LIST_ID kept for older setups). */
export function marketingListId() {
  return process.env.LOOPS_MARKETING_LIST_ID || process.env.LOOPS_FREE_REPORT_LIST_ID || null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const log = (evt: string, data: Record<string, unknown> = {}) => console.log(JSON.stringify({ evt: `consent_${evt}`, ...data }));
const isMissingTable = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || /marketing_consents/.test(e.message ?? ""));

type Row = { email: string; full_name: string | null; last_source: ConsentSource; loops_synced_at: string | null; loops_error: string | null };

async function pushToLoops(email: string, fullName: string | null, source: ConsentSource) {
  return upsertLoopsContact({ email, fullName: fullName ?? undefined, source: LOOPS_SOURCE[source], userGroup: USER_GROUP[source], mailingListId: marketingListId() });
}

export type ConsentResult = { recorded: boolean; synced: boolean; error?: string };

export async function recordMarketingConsent(input: {
  email: string;
  fullName?: string | null;
  source: ConsentSource;
  userId?: string | null;
  /** Skip the Loops call when this consent is already synced (e.g. a repeat login). */
  skipIfSynced?: boolean;
}): Promise<ConsentResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email)) return { recorded: false, synced: false, error: "invalid email" };
  const fullName = input.fullName?.trim().slice(0, 200) || null;
  let recorded = false;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const db = createAdminClient();
      const now = new Date().toISOString();
      const { data: existing, error: readErr } = await db.from("marketing_consents").select("email, full_name, loops_synced_at, loops_error, last_source").eq("email", email).maybeSingle<Row>();
      if (readErr && !isMissingTable(readErr)) throw readErr;
      if (readErr) {
        log("table_missing", { hint: "run supabase/migration-017-marketing-consent.sql" });
      } else if (existing) {
        if (input.skipIfSynced && existing.loops_synced_at && !existing.loops_error) return { recorded: true, synced: true };
        const { error } = await db
          .from("marketing_consents")
          .update({
            last_source: input.source,
            last_consented_at: now,
            consent_text: CONSENT_TEXT[input.source],
            full_name: existing.full_name ?? fullName,
            ...(input.userId ? { user_id: input.userId } : {}),
            updated_at: now,
          })
          .eq("email", email);
        if (error) throw error;
        recorded = true;
      } else {
        const { error } = await db.from("marketing_consents").insert({
          email,
          full_name: fullName,
          user_id: input.userId ?? null,
          source: input.source,
          last_source: input.source,
          consent_text: CONSENT_TEXT[input.source],
        });
        // A parallel request inserted it first: that's fine, it's recorded.
        if (error && error.code !== "23505") throw error;
        recorded = true;
      }
    } catch (e) {
      log("record_failed", { msg: e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e) });
    }
  }

  const res = await pushToLoops(email, fullName, input.source);
  if (recorded) {
    await createAdminClient()
      .from("marketing_consents")
      .update(res.ok ? { loops_synced_at: new Date().toISOString(), loops_error: null } : { loops_error: res.error.slice(0, 300) })
      .eq("email", email)
      .then(({ error }) => error && log("status_write_failed", { msg: error.message }));
  }
  log(res.ok ? "synced" : "sync_failed", { source: input.source, recorded, ...(res.ok ? {} : { error: res.error }) });
  return { recorded, synced: res.ok, ...(res.ok ? {} : { error: res.error }) };
}

/** Consents saved here but not (successfully) in Loops yet. */
export async function countPendingConsents(): Promise<{ total: number; pending: number; lastError: string | null } | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const db = createAdminClient();
  const [all, pend] = await Promise.all([
    db.from("marketing_consents").select("email", { count: "exact", head: true }),
    db.from("marketing_consents").select("loops_error", { count: "exact" }).or("loops_synced_at.is.null,loops_error.not.is.null").order("updated_at", { ascending: false }).limit(1),
  ]);
  if (all.error) return null;
  return { total: all.count ?? 0, pending: pend.count ?? 0, lastError: (pend.data?.[0] as { loops_error: string | null } | undefined)?.loops_error ?? null };
}

/** Retries Loops for consents that aren't synced. Sequential and capped, to respect Loops' rate limit. */
export async function syncPendingConsents(limit = 100): Promise<{ attempted: number; synced: number; failed: number; error?: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { attempted: 0, synced: 0, failed: 0, error: "SUPABASE_SERVICE_ROLE_KEY is not set" };
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_consents")
    .select("email, full_name, last_source, loops_synced_at, loops_error")
    .or("loops_synced_at.is.null,loops_error.not.is.null")
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) return { attempted: 0, synced: 0, failed: 0, error: isMissingTable(error) ? "Run supabase/migration-017-marketing-consent.sql first." : error.message };
  let synced = 0;
  let failed = 0;
  let lastErr: string | undefined;
  for (const r of (data ?? []) as Row[]) {
    const res = await pushToLoops(r.email, r.full_name, r.last_source);
    await db
      .from("marketing_consents")
      .update(res.ok ? { loops_synced_at: new Date().toISOString(), loops_error: null } : { loops_error: res.error.slice(0, 300) })
      .eq("email", r.email);
    if (res.ok) synced++;
    else {
      failed++;
      lastErr = res.error;
      // A config problem (no key, bad list id) won't fix itself on the next row.
      if (/LOOPS_API_KEY|40[013]/.test(res.error)) break;
    }
    await new Promise((r) => setTimeout(r, 120)); // stay well under Loops' 10 requests/second
  }
  log("resync", { attempted: synced + failed, synced, failed });
  return { attempted: synced + failed, synced, failed, ...(lastErr ? { error: lastErr } : {}) };
}

/**
 * Sign-up opt-in: the box is stored on the account (user_metadata) at sign-up
 * and only acted on once the email address is CONFIRMED, so nobody can put
 * someone else's address on the marketing list. Safe to call on every visit:
 * it does nothing for people who didn't opt in, and only one database read for
 * people who did and are already synced.
 */
export async function syncSignupConsent(user: { id: string; email?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> | null } | null) {
  if (!user?.email || !user.email_confirmed_at || user.user_metadata?.marketing_opt_in !== true) return null;
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  return recordMarketingConsent({ email: user.email, fullName: name, source: "signup", userId: user.id, skipIfSynced: true });
}
