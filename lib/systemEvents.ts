// SERVER ONLY. Structured failure log for the admin System Health page
// (table public.system_events, migration 016).
//
// Best-effort by design: recording never throws, never blocks longer than
// ~1.5 s, and does nothing when the service role key or the table is missing,
// so it can never break the request it is describing.
//
// Messages are sanitised: anything that looks like a key, token, bearer header,
// JWT or email address is masked, and the text is capped at 300 characters.
// Never pass user content (prompts, ad copy, report text) as the message.
import { createAdminClient } from "@/lib/supabase/admin";

export type SystemEventCategory =
  | "analysis"
  | "image_generation"
  | "strategy"
  | "ai_provider"
  | "credits"
  | "webhook"
  | "auth"
  | "backend"
  | "job";

export type SystemEvent = {
  category: SystemEventCategory;
  severity?: "info" | "warning" | "error";
  source: string;
  code?: string | null;
  message?: string | null;
  userId?: string | null;
  refId?: string | null;
};

const SECRET_PATTERNS: RegExp[] = [
  /bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g, // JWTs
  /\b(sk|pk|rk|apik|ws|whsec|sb|key)[-_][A-Za-z0-9_-]{8,}/gi, // provider keys / secrets
  /\bAIza[0-9A-Za-z_-]{20,}/g, // Google API keys
  /([?&](key|token|access_token|api_key|secret|signature)=)[^&\s]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, // email addresses
  /\b\d{12,19}\b/g, // long digit runs (card-like numbers)
];

export function sanitizeLogText(input: unknown, max = 300): string | null {
  if (input == null) return null;
  let s = input instanceof Error ? input.message : typeof input === "string" ? input : String(input);
  for (const re of SECRET_PATTERNS) {
    s = s.replace(re, (m, p1) => (typeof p1 === "string" && p1.endsWith("=") ? `${p1}[redacted]` : "[redacted]"));
  }
  s = s.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s || null;
}

const ID = /^[A-Za-z0-9_.:-]{1,120}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function recordSystemEvent(e: SystemEvent): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const row = {
      category: e.category,
      severity: e.severity ?? "error",
      source: (sanitizeLogText(e.source, 80) ?? "unknown").slice(0, 80),
      code: e.code ? sanitizeLogText(e.code, 60) : null,
      message: sanitizeLogText(e.message),
      user_id: e.userId && UUID.test(e.userId) ? e.userId : null,
      ref_id: e.refId && ID.test(e.refId) ? e.refId : null,
    };
    const insert = createAdminClient().from("system_events").insert(row).then(() => undefined);
    await Promise.race([insert, new Promise<void>((r) => setTimeout(r, 1500))]);
  } catch {
    /* never let logging break the caller */
  }
}

/**
 * At most one event per key per window, per server instance. Used for failures an
 * outsider can trigger at will (e.g. unsigned webhook calls), so they can't flood
 * the table. Returns how many occurrences were suppressed since the last record,
 * or null when this occurrence should not be recorded.
 */
const throttles = new Map<string, { last: number; suppressed: number }>();
export function throttle(key: string, windowMs = 60_000): number | null {
  const now = Date.now();
  const t = throttles.get(key);
  if (t && now - t.last < windowMs) {
    t.suppressed++;
    return null;
  }
  const suppressed = t?.suppressed ?? 0;
  throttles.set(key, { last: now, suppressed: 0 });
  return suppressed;
}
