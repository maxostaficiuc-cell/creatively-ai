"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="mt-6 w-full rounded-xl border border-base-border px-4 py-2.5 text-sm font-medium text-ink-primary transition hover:bg-white/5"
    >
      Sign out
    </button>
  );
}
