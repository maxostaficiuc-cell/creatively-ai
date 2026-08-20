import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdAccount } from "@/lib/types";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export function isMetaConfigured() {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export async function getConnectedAdAccount(
  supabase: SupabaseClient,
  userId: string,
  platform: "meta" | "tiktok" | "google" = "meta"
): Promise<AdAccount | null> {
  const { data } = await supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("status", "connected")
    .maybeSingle<AdAccount>();

  return data ?? null;
}

// Real Meta Graph API calls — used once a user has actually connected their
// account. These are genuine requests against Meta's API, never fabricated
// data. If the token is invalid/expired, the caller should treat a thrown
// error as "needs reconnect" and fall back to the empty state.
async function metaFetch(path: string, accessToken: string, params: Record<string, string> = {}) {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function fetchMetaCampaigns(accessToken: string, adAccountId: string) {
  const data = await metaFetch(`/${adAccountId}/campaigns`, accessToken, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget",
  });
  return data.data as unknown[];
}

export async function fetchMetaAdSets(accessToken: string, adAccountId: string) {
  const data = await metaFetch(`/${adAccountId}/adsets`, accessToken, {
    fields: "id,name,status,campaign_id,daily_budget,targeting",
  });
  return data.data as unknown[];
}

export async function fetchMetaAds(accessToken: string, adAccountId: string) {
  const data = await metaFetch(`/${adAccountId}/ads`, accessToken, {
    fields: "id,name,status,adset_id,creative",
  });
  return data.data as unknown[];
}

export async function fetchMetaInsights(accessToken: string, adAccountId: string, datePreset = "last_30d") {
  const data = await metaFetch(`/${adAccountId}/insights`, accessToken, {
    fields: "spend,impressions,clicks,ctr,cpc,cpm,actions,action_values",
    date_preset: datePreset,
  });
  return data.data as unknown[];
}
