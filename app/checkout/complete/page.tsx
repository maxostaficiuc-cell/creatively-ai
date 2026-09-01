import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutStatusPoller } from "./CheckoutStatusPoller";

// This page used to show "Thanks — payment received" unconditionally,
// regardless of whether the payment actually succeeded — trusting the
// redirect itself as proof. It never was. The redirect only tells us the
// user finished (or left) the Whop checkout flow; it says nothing about
// whether the payment succeeded. The only thing that can say that is the
// verified Whop webhook writing subscription_status = 'active' to this
// user's row, which is exactly what CheckoutStatusPoller waits for.
export default async function CheckoutCompletePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const initiallyActive = profile?.subscription_status === "active";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-bg px-6 text-center">
      <CheckoutStatusPoller initiallyActive={initiallyActive} />
    </div>
  );
}
