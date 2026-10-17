// SERVER ONLY — Loops (https://loops.so) event helper.
//
// Sends conversion-funnel events that Loops "Loops" (automations) can trigger
// emails from. Design rules:
//   • Does nothing unless LOOPS_API_KEY is set (server-side env var only).
//   • Never blocks or breaks the request that calls it (short timeout, errors
//     are logged and swallowed).
//   • Never creates a contact without consent: callers either pass
//     `consented: true` (the visitor ticked the email opt-in) or the helper
//     first checks the contact already exists in Loops.
//   • Only non-sensitive properties — never uploads, report contents or
//     payment data.

import { STARTER_TRIAL } from "@/lib/starterTrial";

const API = "https://app.loops.so/api/v1";

export type LoopsEventName =
  | "free_report_started"
  | "free_report_completed"
  | "free_report_limit_reached"
  | "starter_trial_cta_clicked"
  | "starter_trial_checkout_started"
  | "starter_trial_subscribed";

/** Offer details attached to every event (all non-sensitive). */
export const OFFER_PROPS = {
  plan: "starter",
  intro_price: STARTER_TRIAL.introPrice,
  intro_period_days: STARTER_TRIAL.days,
  recurring_price: STARTER_TRIAL.renewalPrice,
  currency: "USD",
} as const;

function apiKey() {
  return process.env.LOOPS_API_KEY || null;
}

async function call(path: string, init: RequestInit & { idempotencyKey?: string }) {
  const key = apiKey();
  if (!key) return null;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey.slice(0, 100);
  return fetch(`${API}${path}`, { ...init, headers, signal: AbortSignal.timeout(4000) });
}

/** True if this email is already a contact in Loops (so we never create one). */
export async function loopsContactExists(email: string): Promise<boolean> {
  try {
    const res = await call(`/contacts/find?email=${encodeURIComponent(email)}`, { method: "GET" });
    if (!res?.ok) return false;
    const data = (await res.json()) as unknown;
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Create or update a contact in Loops, keyed by email (PUT /contacts/update
 * creates it when it doesn't exist, so retries never make duplicates). Only
 * call this for someone who explicitly opted in to marketing emails — see
 * lib/marketingConsent.ts. Never throws; resolves to what happened.
 *
 * `subscribed` is deliberately not sent: Loops recommends leaving it out unless
 * you mean to resubscribe someone, so a contact who unsubscribed earlier stays
 * unsubscribed even if they opt in again somewhere.
 */
export async function upsertLoopsContact(params: {
  email: string;
  fullName?: string;
  /** Shown as "Source" in Loops (default contact property). */
  source: string;
  /** Shown as "User group" in Loops (default contact property). */
  userGroup: string;
  /** Loops mailing list id to add the contact to (the marketing list). */
  mailingListId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!apiKey()) return { ok: false, error: "LOOPS_API_KEY is not set on the server" };
  const parts = (params.fullName || "").trim().split(/\s+/).filter(Boolean);
  const body: Record<string, unknown> = {
    email: params.email,
    source: params.source,
    userGroup: params.userGroup,
  };
  if (parts.length) body.firstName = parts[0].slice(0, 100);
  if (parts.length > 1) body.lastName = parts.slice(1).join(" ").slice(0, 100);
  if (params.mailingListId) body.mailingLists = { [params.mailingListId]: true };
  try {
    const res = await call("/contacts/update", { method: "PUT", body: JSON.stringify(body) });
    if (!res) return { ok: false, error: "LOOPS_API_KEY is not set on the server" };
    if (!res.ok) {
      // Loops' own message (e.g. an unknown mailing list id) — never contains the key.
      const msg = await res
        .json()
        .then((j: { message?: string }) => j?.message ?? "")
        .catch(() => "");
      console.error(`loops: contact upsert failed with ${res.status}${msg ? `: ${msg}` : ""}`);
      return { ok: false, error: `Loops returned ${res.status}${msg ? `: ${msg.slice(0, 160)}` : ""}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("loops: contact upsert threw:", msg);
    return { ok: false, error: `Couldn't reach Loops (${msg.slice(0, 120)})` };
  }
}

export async function sendLoopsEvent(params: {
  email: string;
  eventName: LoopsEventName;
  /** The visitor explicitly opted in to emails in this request. */
  consented?: boolean;
  eventProperties?: Record<string, string | number | boolean>;
  /** Root-level contact properties (e.g. firstName) — only sent with consent. */
  contactProperties?: Record<string, string | number | boolean>;
  /** Dedupe key: Loops ignores a repeat with the same key for 24h. */
  idempotencyKey?: string;
}) {
  if (!apiKey()) return;
  try {
    if (!params.consented && !(await loopsContactExists(params.email))) return;
    const res = await call("/events/send", {
      method: "POST",
      idempotencyKey: params.idempotencyKey,
      body: JSON.stringify({
        email: params.email,
        eventName: params.eventName,
        eventProperties: { ...OFFER_PROPS, ...params.eventProperties },
        ...(params.consented ? params.contactProperties : {}),
      }),
    });
    if (res && !res.ok && res.status !== 409) {
      console.error(`loops: ${params.eventName} failed with ${res.status}`);
    }
  } catch (err) {
    console.error(`loops: ${params.eventName} threw:`, err instanceof Error ? err.message : err);
  }
}
