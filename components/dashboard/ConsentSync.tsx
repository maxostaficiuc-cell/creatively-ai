"use client";

import { useEffect } from "react";

/** Once per browser session: lets the server finish a sign-up opt-in (see /api/account/marketing-consent). Renders nothing. */
export function ConsentSync() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cai_consent_sync")) return;
      sessionStorage.setItem("cai_consent_sync", "1");
    } catch {
      /* storage blocked: still fine to call once per page load */
    }
    fetch("/api/account/marketing-consent", { method: "POST" }).catch(() => undefined);
  }, []);
  return null;
}
