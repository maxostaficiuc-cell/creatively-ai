import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreshProfile } from "@/lib/profile";
import { AppShell } from "@/components/dashboard/AppShell";
import { StrategyClient, type HistoryItem } from "@/components/strategy/StrategyClient";
import { claudeConfigured } from "@/lib/claudeJson";
import { geminiConfigured } from "@/lib/geminiImage";
import { loadGenerations, loadStrategy } from "@/lib/strategyServer";
import { CREDIT_COST_GENERATED_IMAGE } from "@/lib/types";
import type { Generation, Strategy } from "@/lib/strategyTypes";

export const dynamic = "force-dynamic";

export default async function CreativeStrategyPage({ searchParams }: { searchParams: { s?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await getFreshProfile(supabase, user.id);

  let history: HistoryItem[] = [];
  let strategy: Strategy | null = null;
  let generations: Generation[] = [];
  let setupMissing = false;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createAdminClient();
    const { data, error } = await db
      .from("brand_strategies")
      .select("id,brand_name,website_url,social_url,version,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) setupMissing = /brand_strategies/.test(error.message);
    history = (data ?? []) as HistoryItem[];
    if (searchParams.s) {
      strategy = await loadStrategy(db, searchParams.s, user.id);
      if (strategy) generations = await loadGenerations(db, strategy.id, user.id);
    }
  } else {
    setupMissing = true;
  }

  return (
    <AppShell profile={profile ?? null} greeting="Creative Strategy" subtitle="Your AI ad strategist: brand analysis, concepts and ready-to-test creatives.">
      <StrategyClient
        initialStrategy={strategy}
        initialGenerations={generations}
        history={history}
        isPaying={profile?.subscription_status === "active"}
        aiReady={claudeConfigured() && !setupMissing}
        imagesReady={geminiConfigured()}
        setupMissing={setupMissing}
        creditCost={CREDIT_COST_GENERATED_IMAGE}
      />
    </AppShell>
  );
}
