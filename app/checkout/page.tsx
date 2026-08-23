import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { WhopCheckout } from "./WhopCheckout";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!searchParams.session) redirect("/billing");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-bg px-6 py-16">
      <div className="mb-8">
        <Logo href="/billing" />
      </div>
      <div className="w-full max-w-lg">
        <WhopCheckout
          sessionId={searchParams.session}
          returnUrl={`${appUrl}/checkout/complete`}
          sandbox={process.env.WHOP_SANDBOX === "true"}
        />
      </div>
    </div>
  );
}
