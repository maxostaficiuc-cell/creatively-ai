// SERVER ONLY — which ad-account integrations are actually usable.
//
// An integration is "available" only when it is configured AND switched live.
// Meta needs META_APP_ID + META_APP_SECRET (the OAuth app) and
// META_INTEGRATION_LIVE=true (set this only once Meta has approved the app and
// the flow has been tested end to end). Until then every connect button stays
// disabled, so nobody is sent into an unfinished OAuth flow.
// TikTok and Google have no integration code yet, so they are always "coming soon".
import { isMetaConfigured } from "@/lib/meta/client";

export type IntegrationId = "meta" | "tiktok" | "google";
export type Integration = {
  id: IntegrationId;
  name: string;
  description: string;
  status: "available" | "coming_soon";
  connectHref: string | null;
};

export function getIntegrations(): Integration[] {
  const metaLive = isMetaConfigured() && process.env.META_INTEGRATION_LIVE === "true";
  return [
    {
      id: "meta",
      name: "Meta Ads",
      description: "Facebook & Instagram campaigns",
      status: metaLive ? "available" : "coming_soon",
      connectHref: metaLive ? "/api/meta/connect" : null,
    },
    { id: "tiktok", name: "TikTok Ads", description: "TikTok campaigns", status: "coming_soon", connectHref: null },
    { id: "google", name: "Google Ads", description: "Search, YouTube & Performance Max", status: "coming_soon", connectHref: null },
  ];
}

export const anyIntegrationLive = () => getIntegrations().some((i) => i.status === "available");
