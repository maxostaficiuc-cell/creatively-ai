"use client";

import { WhopCheckoutEmbed } from "@whop/checkout/react";

export function WhopCheckout({
  sessionId,
  returnUrl,
  sandbox,
}: {
  sessionId: string;
  returnUrl: string;
  sandbox: boolean;
}) {
  return (
    <WhopCheckoutEmbed
      sessionId={sessionId}
      returnUrl={returnUrl}
      environment={sandbox ? "sandbox" : "production"}
      theme="dark"
      themeOptions={{ accentColor: "#8B5CF6" }}
      fallback={<CheckoutSkeleton />}
    />
  );
}

function CheckoutSkeleton() {
  return <div className="h-[560px] w-full animate-pulse rounded-2xl bg-base-card" />;
}
