// SERVER ONLY. Records each VERIFIED Whop webhook event in public.billing_events
// (migration 016) so the admin Payments page can show real, provider-sourced
// payment history. Called by the webhook route only after the signature has
// been verified. Best-effort: never throws, never changes access or credits.
//
// Stored: ids, status fields, amount/currency/dates exactly as Whop sent them,
// the buyer email (lower-cased) and our plan name. NOT stored: card details,
// payment-method data, addresses, phone numbers, or the raw payload.
import { createAdminClient } from "@/lib/supabase/admin";

type Obj = Record<string, unknown>;

const str = (v: unknown, max = 120): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
/** Whop sends ISO strings; some older fields are unix seconds. */
const time = (v: unknown): string | null => {
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  if (typeof v === "string" && v) {
    const d = new Date(/^\d+$/.test(v) ? Number(v) * (v.length <= 10 ? 1000 : 1) : v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
};

export type BillingEventFields = {
  email: string | null;
  whop_payment_id: string | null;
  whop_membership_id: string | null;
  whop_plan_id: string | null;
  status: string | null;
  substatus: string | null;
  billing_reason: string | null;
  amount: number | null;
  currency: string | null;
  refunded_amount: number | null;
  paid_at: string | null;
  occurred_at: string | null;
};

export function extractBillingFields(type: string, data: Obj): BillingEventFields {
  const isPayment = type.startsWith("payment.") || type.startsWith("refund.") || type.startsWith("dispute.");
  const id = str(data.id);
  const membership = obj(data.membership);
  const plan = obj(data.plan);
  const user = obj(data.user);
  const email = str(user?.email, 320)?.toLowerCase() ?? null;
  return {
    email,
    whop_payment_id: isPayment && id?.startsWith("pay_") ? id : str(data.payment_id),
    whop_membership_id: str(membership?.id) ?? str(data.membership_id) ?? (id?.startsWith("mem_") ? id : null),
    whop_plan_id: str(plan?.id) ?? str(data.plan_id),
    status: str(data.status, 40),
    substatus: str(data.substatus, 40),
    billing_reason: str(data.billing_reason, 40),
    amount: isPayment ? num(data.total) ?? num(data.final_amount) ?? num(data.subtotal) : null,
    currency: str(data.currency, 10)?.toLowerCase() ?? null,
    refunded_amount: isPayment ? num(data.refunded_amount) : null,
    paid_at: time(data.paid_at),
    occurred_at: time(data.updated_at) ?? time(data.created_at),
  };
}

export async function recordBillingEvent(
  event: { id: string; type: string; data: Obj },
  outcome: string,
  ourPlan: string | null
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const db = createAdminClient();
    const f = extractBillingFields(event.type, event.data ?? {});
    let matchedUserId: string | null = null;
    if (f.email) {
      const { data } = await db.from("profiles").select("id").ilike("email", f.email).maybeSingle();
      matchedUserId = (data as { id?: string } | null)?.id ?? null;
    }
    await db.from("billing_events").upsert(
      {
        id: String(event.id).slice(0, 120),
        type: String(event.type).slice(0, 60),
        outcome: outcome.slice(0, 40),
        plan: ourPlan,
        matched_user_id: matchedUserId,
        ...f,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  } catch {
    /* recording must never affect webhook handling */
  }
}
