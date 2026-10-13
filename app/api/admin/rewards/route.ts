import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShowcaseAdmin } from "@/lib/showcaseServer";
import { anyIntegrationLive, getIntegrations } from "@/lib/integrations";
import { EARLY_REWARD_PROGRAM } from "@/lib/rewards";

// Admin-only: status of the early-customer reward, and the launch action.
// Launching is refused until at least one ad-account integration is genuinely
// live (configured + META_INTEGRATION_LIVE=true), so the reward cannot be paid
// out before the promise it's tied to exists.

export const runtime = "nodejs";

async function guard() {
  const admin = await getShowcaseAdmin();
  if (admin.ok) return null;
  const status = admin.reason === "not-signed-in" ? 401 : admin.reason === "not-configured" ? 503 : 403;
  return NextResponse.json({ error: "Not allowed." }, { status });
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const db = createAdminClient();
  const { data: program, error } = await db.from("reward_programs").select("*").eq("id", EARLY_REWARD_PROGRAM).maybeSingle();
  if (error || !program) return NextResponse.json({ error: "Run supabase/migration-013-early-customer-reward.sql first." }, { status: 503 });
  const count = async (status: string) =>
    (await db.from("reward_grants").select("id", { count: "exact", head: true }).eq("program_id", EARLY_REWARD_PROGRAM).eq("status", status)).count ?? 0;
  return NextResponse.json({
    program,
    reserved: await count("reserved"),
    granted: await count("granted"),
    integrations: getIntegrations().map(({ id, name, status }) => ({ id, name, status })),
    canLaunch: anyIntegrationLive(),
  });
}

/** POST { confirm: "LAUNCH" } — marks the program launched and grants reserved rewards. Safe to repeat. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { confirm?: unknown } | null;
  if (body?.confirm !== "LAUNCH") return NextResponse.json({ error: "Type LAUNCH to confirm." }, { status: 400 });
  if (!anyIntegrationLive()) {
    return NextResponse.json({ error: "No ad-account integration is live yet. The reward can only launch with the integrations." }, { status: 409 });
  }
  const { data, error } = await createAdminClient().rpc("launch_reward_program", { p_program_id: EARLY_REWARD_PROGRAM });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  console.log(JSON.stringify({ evt: "reward_launch", program: EARLY_REWARD_PROGRAM, result: data }));
  return NextResponse.json({ result: data });
}
